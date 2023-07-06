import { createForm, custom, required, reset } from "@modular-forms/solid";
import { Motion, Presence } from "@motionone/solid";
import { Show, createSignal } from "solid-js";
import { nip19, generatePrivateKey, getPublicKey } from "nostr-tools";

const API_URL = import.meta.env.VITE_ZAPPLE_API_URL;

type ZappleForm = {
  npub: string;
  amount_sats: string;
  nwc: string;
};

export default function Home() {
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<Error>();
  const [saved, setSaved] = createSignal(false);
  const [zappleForm, { Form, Field }] = createForm<ZappleForm>({
    initialValues: {
      npub: "",
      amount_sats: "",
      nwc: "",
    },
  });

  const handleSubmit = async (f: ZappleForm) => {
    const { npub, amount_sats, nwc } = f;
    setSaving(true);
    setError(undefined);

    const npubHex = nip19.decode(npub).data;

    try {
      const res = await fetch(`https://${API_URL}/set-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npub: npubHex,
          amount_sats: Number(amount_sats),
          nwc,
          donations: [],
        }),
      });

      if (res.ok) {
        console.log("saved");
        setSaved(true);
      } else {
        throw new Error("something went wrong");
      }
    } catch (e) {
      console.error(e);
      setError(e as Error);
    } finally {
      setSaving(false);
    }
  };

  // regex for just numbers
  const regex = /^[0-9]+$/;

  return (
    <main>
      <Motion.section
        initial={{ transform: "scaleY(0)" }}
        inView={{ transform: "scaleY(1)" }}
        class="h-[100vh] w-full flex flex-col items-center justify-center  bg-primary text-background"
      >
        <Motion.h1
          inView={{ transform: "scaleY(5)" }}
          initial={{ transform: "scaleY(1)" }}
          inViewOptions={{ amount: 0.5 }}
          class="font-bold text-[10vh] mx-auto"
        >
          Zapple&nbsp;Pay
        </Motion.h1>
      </Motion.section>
      <Presence>
        <Show when={!saved()}>
          <Motion.section
            inView={{ opacity: 1 }}
            inViewOptions={{ amount: 0.5 }}
            initial={{ opacity: 0 }}
            class="min-h-[100vh] p-8 max-w-xl mx-auto flex flex-col justify-center"
          >
            <p class="mb-4">
              Zapple Pay lets you Zap from any nostr client. Just react to a{" "}
              <s>note</s>{" "}
              <span class="text-xl text-primary font-semibold">
                UnLoCkAbLe dIgItAl cOnTeNt
              </span>{" "}
              with a ⚡️ emoji and Zapple Pay will notify your lightning wallet
              over NWC to pay the zap.
            </p>
            <Form onSubmit={handleSubmit} class="max-w-xl flex flex-col">
              <Field
                name="npub"
                validate={[
                  required("Please enter an npub"),
                  custom((value) => {
                    let decoded = nip19.decode(value!);
                    if (decoded.data) {
                      return true;
                    } else {
                      return false;
                    }
                  }, "Please enter a valid npub"),
                ]}
              >
                {(field, props) => (
                  <>
                    <label>npub</label>
                    <input {...props} placeholder="npub1p4..." />
                    {field.error && (
                      <div class="text-red-500">{field.error}</div>
                    )}
                  </>
                )}
              </Field>
              <Field
                name="amount_sats"
                validate={[
                  required("Please enter an amount"),
                  custom((value) => {
                    if (regex.test(value!)) {
                      return true;
                    } else {
                      return false;
                    }
                  }, "Please enter a number"),
                ]}
              >
                {(field, props) => (
                  <>
                    <label>zap amount (in sats)</label>
                    <input {...props} placeholder="420" />
                    {field.error && (
                      <div class="text-red-500">{field.error}</div>
                    )}
                  </>
                )}
              </Field>
              <Field
                name="nwc"
                validate={[required("Please enter an nwc connection string")]}
              >
                {(field, props) => (
                  <>
                    <label>nwc connection string</label>
                    <textarea
                      {...props}
                      placeholder="nostr+walletconnect://7c30..."
                      rows="5"
                    />
                    {field.error && (
                      <div class="text-red-500">{field.error}</div>
                    )}
                  </>
                )}
              </Field>
              <Show when={!!error()}>
                <p class="text-red-500">Error: {error()?.message}</p>
              </Show>

              <button
                type="submit"
                class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
              >
                {saving() ? "SAVING..." : "SAVE"}
              </button>
            </Form>
          </Motion.section>
        </Show>
        <Motion.section
          inView={{ opacity: 1 }}
          inViewOptions={{ amount: 0.5 }}
          initial={{ opacity: 0 }}
          class="min-h-[100vh] p-8 max-w-xl mx-auto flex flex-col justify-center items-center"
        >
          <h1 class="text-4xl font-bold mb-4">SAVED</h1>
          <button
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
            onClick={() => {
              reset(zappleForm);
              setSaved(false);
            }}
          >
            DO ANOTHER
          </button>
        </Motion.section>
      </Presence>
    </main>
  );
}
