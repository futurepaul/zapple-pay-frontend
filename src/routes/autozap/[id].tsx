import {
  createForm,
  custom,
  getValue,
  getValues,
  required,
  setValue,
} from "@modular-forms/solid";
import { Motion } from "@motionone/solid";
import { NDKUser, NDKUserProfile } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { For, Show, createResource, createSignal } from "solid-js";
import { useParams, useSearchParams } from "solid-start";
import { Header, VStack } from "~/components";
import { AutoFaq } from "~/components/AutoZapFaq";
import { CreateAutozapPage } from "~/components/CreateButton";

const PRIMAL_API = "https://primal-cache.mutinywallet.com/api";
const API_URL = import.meta.env.VITE_ZAPPLE_API_URL;
const ZAPPLE_PAY_NPUB =
  "npub1wxl6njlcgygduct7jkgzrvyvd9fylj4pqvll6p32h59wyetm5fxqjchcan";

function formatMutinyLink(
  name: string,
  npub: string,
  interval?: string,
  amount?: string
) {
  // OUTPUT: https://app.mutinywallet.com/settings/connections?return_to=http%3A%2F%2Flocalhost%3A3000%2Fautozap%2Fnpub1p4kg8zxukpym3h20erfa3samj00rm2gt4q5wfuyu3tg0x3jg3gesvncxf8&budget_renewal=day&max_amount=1234
  const appUrl = "https://app.mutinywallet.com";
  const path = "/settings/connections";
  const callbackUrlOrigin = window.location.origin;
  const callbackUrl = `${callbackUrlOrigin}/autozap/${npub}`;

  const query = new URLSearchParams({
    return_to: callbackUrl,
    name: `AutoZap-${name}`,
    budget_renewal: interval || "day",
    max_amount: amount || "1000",
  });

  return `${appUrl}${path}?${query.toString()}`;
}

export function getHexpubFromNpub(npub?: string) {
  if (!npub) return;
  // If it doesn't start with npub let's just assume it's a hexpub
  if (!npub.startsWith("npub")) return npub;
  const user = new NDKUser({ npub });
  return user.hexpubkey;
}

export function getNpubFromHexpub(hexpub?: string) {
  if (!hexpub) return;
  const user = new NDKUser({ hexpubkey: hexpub });
  return user.npub;
}

async function fetchUser(npub: string) {
  try {
    const hexpubkey = getHexpubFromNpub(npub);

    const query = {
      kinds: [0],
      limit: 100,
      pubkeys: [hexpubkey],
    };

    const restPayload = JSON.stringify(["zaps_feed", query]);

    const response = await fetch(PRIMAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: restPayload,
    });

    if (!response.ok) {
      throw new Error(`Failed to load profile`);
    }

    // an array of profiles
    const data = await response.json();

    // find the specific profile we wanted
    const profile = data.find((profile: any) => profile.pubkey === hexpubkey);

    // return profile
    const parsedProfile = JSON.parse(profile.content);
    return parsedProfile;
  } catch (e) {
    console.error(e);
  }
}

type AutoZapFormType = {
  include_sender_npub: boolean;
  from_npub?: string;
  manual_nwc: boolean;
  amount_sats: string;
  nwc: string;
  interval: "day" | "week" | "month";
};

function AutoZapForm(props: {
  npub: string;
  userProfile?: NDKUserProfile;
  callbackNwc?: string;
}) {
  const [error, setError] = createSignal<Error | undefined>(undefined);
  const [saved, setSaved] = createSignal(false);

  function restoreStateFromLocalStorage() {
    if (typeof window === "undefined") return undefined;
    const formState = localStorage.getItem(`autozap:${props.npub}`);

    // Clear localstorage
    localStorage.removeItem(`autozap:${props.npub}`);

    if (formState) {
      const parsedState = JSON.parse(formState);
      return parsedState;
    }
  }

  const cachedFormState = restoreStateFromLocalStorage();

  const [autoForm, { Form, Field }] = createForm<AutoZapFormType>({
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (values.manual_nwc && !values.nwc) {
        errors.nwc = "Please enter a NWC string";
      }
      return errors;
    },

    initialValues: {
      include_sender_npub: cachedFormState?.include_sender_npub || false,
      from_npub: cachedFormState?.from_npub || undefined,
      amount_sats: cachedFormState?.amount_sats || undefined,
      manual_nwc: false,
      nwc: "",
      interval: cachedFormState?.interval || "day",
    },
  });

  const handleSubmit = async (f: AutoZapFormType) => {
    const { from_npub, amount_sats, nwc, interval } = f;

    const to_npub_hex = nip19.decode(props.npub).data;

    // If there's no from npub set, just use zapple pay's npub
    const from_npub_hex = nip19.decode(from_npub || ZAPPLE_PAY_NPUB).data;

    const payload = {
      npub: from_npub_hex,
      to_npub: to_npub_hex,
      nwc: searchParams.nwc ? searchParams.nwc : nwc,
      amount_sats: Number(amount_sats),
      time_period: interval,
    };

    try {
      if (!payload.nwc) {
        throw new Error("You must connect a wallet");
      }

      const res = await fetch(`https://${API_URL}/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        // if there's response text print that error
        const text = await res.text();
        throw new Error(text);
      }
    } catch (e) {
      console.error(e);
      setError(e as Error);
    }
  };
  // regex for just numbers
  const regex = /^[0-9]+$/;

  const [searchParams] = useSearchParams();

  function handleConnectMutiny() {
    if (typeof window === "undefined") return undefined;

    // Save current state of form to localstorage
    const formState = getValues(autoForm);

    // Save to localstorage
    localStorage.setItem(`autozap:${props.npub}`, JSON.stringify(formState));

    const name =
      props.userProfile?.name ||
      props.userProfile?.display_name ||
      props.userProfile?.displayName;

    window.location.href = formatMutinyLink(
      name || "",
      props.npub,
      getValue(autoForm, "interval"),
      getValue(autoForm, "amount_sats")
    );
  }

  return (
    <>
      <Show when={!saved()}>
        <Form
          onSubmit={handleSubmit}
          class="flex flex-col gap-4 w-full max-w-[20rem]"
        >
          <Field
            name="amount_sats"
            validate={[
              required("Please enter an amount"),
              custom((value) => {
                return regex.test(value!);
              }, "Please enter a number"),
            ]}
          >
            {(field, props) => (
              <VStack>
                <Header>How much?</Header>
                <input
                  {...props}
                  type="number"
                  placeholder="21 sats"
                  value={field.value}
                />
                {field.error && <div class="text-red-500">{field.error}</div>}
              </VStack>
            )}
          </Field>

          <Field name="interval">
            {(field, props) => (
              <VStack>
                <Header>How often?</Header>
                <select {...props} value={field.value}>
                  <For
                    each={[
                      {
                        label: "Daily",
                        value: "day",
                      },
                      {
                        label: "Weekly",
                        value: "week",
                      },
                      {
                        label: "Monthly",
                        value: "month",
                      },
                    ]}
                  >
                    {({ label, value }) => (
                      <option
                        value={value}
                        class="capitalize"
                        selected={field.value === value}
                      >
                        {label}
                      </option>
                    )}
                  </For>
                </select>
              </VStack>
            )}
          </Field>
          <Field name="include_sender_npub" type="boolean">
            {(field, props) => (
              <div class={"flex gap-4 items-center"}>
                <input
                  class="w-4 h-4 m-0"
                  id={field.name}
                  type={"checkbox"}
                  {...props}
                  checked={field.value}
                ></input>
                <label class="text-xl font-semibold" for={field.name}>
                  Should they know it's you?
                </label>
              </div>
            )}
          </Field>
          <Show when={getValue(autoForm, "include_sender_npub")}>
            <Field
              name="from_npub"
              validate={[
                required("Please enter an npub"),
                custom((value) => {
                  let decoded = nip19.decode(value!);
                  return !!decoded.data;
                }, "Please enter a valid npub"),
              ]}
            >
              {(field, props) => (
                <VStack>
                  <Header>Okay, what's your npub?</Header>
                  <input
                    {...props}
                    placeholder="npub1p4..."
                    value={field.value}
                  />
                  {field.error && <div class="text-red-500">{field.error}</div>}
                </VStack>
              )}
            </Field>
          </Show>

          <Show when={!searchParams.nwc}>
            <div class="flex flex-col gap-4">
              <VStack>
                <Header>Connection method</Header>
              </VStack>
              <div class="flex flex-col gap-2">
                <button
                  onClick={handleConnectMutiny}
                  disabled={getValue(autoForm, "manual_nwc")}
                  class="bg-[#E53254] px-4 py-3 rounded disabled:opacity-25"
                  type="button"
                >
                  Connect Mutiny Wallet
                </button>
                <Field name="manual_nwc" type="boolean">
                  {(field, props) => (
                    <button
                      onClick={() =>
                        setValue(
                          autoForm,
                          "manual_nwc",
                          !getValue(autoForm, "manual_nwc")
                        )
                      }
                      class="bg-neutral-500 px-4 py-3 rounded"
                      type="button"
                    >
                      Manual Connect
                    </button>
                  )}
                </Field>
                <Show when={getValue(autoForm, "manual_nwc")}>
                  <Field name="nwc">
                    {(field, props) => (
                      <>
                        <textarea
                          {...props}
                          placeholder="nostr+walletconnect://7c30..."
                          rows="5"
                          class="w-full max-w-[20rem]"
                        />
                        {field.error && (
                          <div class="text-red-500">{field.error}</div>
                        )}
                      </>
                    )}
                  </Field>
                </Show>
              </div>
            </div>
          </Show>
          <Show when={searchParams.nwc}>
            <div class="p-4 bg-[hsl(0,0%,10%)] rounded w-full max-w-[20rem] flex flex-col gap-4">
              <span class="text-lg font-semibold">✅ Wallet Connected</span>
              <pre class="truncate w-full text-neutral-600">
                {searchParams.nwc}
              </pre>
            </div>
          </Show>
          <Show when={!!error()}>
            <p class="text-red-500">{error()?.message}</p>
          </Show>
          <button
            type="submit"
            disabled={autoForm.invalid || autoForm.submitting}
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto disabled:opacity-25"
          >
            {autoForm.submitting ? "SAVING..." : "SAVE"}
          </button>
        </Form>
      </Show>
      <Show when={saved()}>
        <Motion.section
          inView={{ opacity: 1 }}
          inViewOptions={{ amount: 0.5 }}
          initial={{ opacity: 0 }}
          class="p-8 max-w-xl mx-auto flex flex-col justify-center items-center"
        >
          <h1 class="text-4xl font-bold mb-4">SAVED</h1>
          <button
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
            onClick={() => {
              window.location.replace(location.pathname);
            }}
          >
            START OVER
          </button>
        </Motion.section>
      </Show>
    </>
  );
}

export default function AutoZap() {
  const params = useParams();

  const [user] = createResource(params.id, fetchUser);
  return (
    <main class="pb-8">
      <div
        class="w-full bg-neutral-900 aspect-[3/1] min-h-[8rem] bg-cover bg-center bg-no-repeat max-h-[16rem]"
        style={{ "background-image": `url(${user()?.banner})` }}
      >
        <Show when={user()}>
          <div
            class="h-full bg-neutral-900 aspect-square max-h-[16rem] rounded-full translate-y-1/2 ml-auto mr-auto drop-shadow bg-cover bg-center bg-no-repeat border-2 border-black"
            style={{ "background-image": `url(${user()?.picture})` }}
          ></div>
        </Show>
        <Show when={!user()}>
          <div class="animate-pulse h-full flex flex-col text-3xl font-bold items-center justify-center bg-neutral-900 aspect-square max-h-[16rem] rounded-full translate-y-1/2 ml-auto mr-auto drop-shadow bg-cover bg-center bg-no-repeat border-2 border-black">
            ???
          </div>
        </Show>
      </div>
      {/* invisible spacer */}
      <div class="w-full aspect-[6/1] max-h-[8rem] min-h-[4rem]"></div>
      <div class="flex flex-col items-center gap-8 pt-8 mx-2">
        <Show when={!user()}>
          <h1 class="text-4xl font-semibold text-center">User not found</h1>
        </Show>
        <Show when={user()}>
          <h1 class="text-4xl font-semibold text-center">
            AutoZap{" "}
            <span class="text-primary shadow">
              {user()?.name || user()?.display_name || user()?.displayName}
            </span>
          </h1>
        </Show>
        <Show when={user()}>
          <AutoZapForm npub={params.id} userProfile={user()} />
        </Show>

        <AutoFaq />
        <CreateAutozapPage />
      </div>
    </main>
  );
}
