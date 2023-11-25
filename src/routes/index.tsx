import {
    createForm,
    custom,
    getValue,
    required,
    reset,
    setValue,
    submit
} from "@modular-forms/solid";
import { Motion } from "@motionone/solid";
import { For, Show, Suspense, createMemo, createSignal } from "solid-js";
import { nip19 } from "nostr-tools";
import { isOnlyOneEmoji } from "~/regex";
import { CheckOut } from "~/components/CheckOut";
import { NWA } from "~/components/Auth";
import { LoadingSpinner } from "~/components/LoadingSpinner";

const API_URL = import.meta.env.VITE_ZAPPLE_API_URL;

const EMOJI_OPTIONS = ["⚡️", "🤙", "👍", "❤️", "🫂"];

type ZappleForm = {
    npub: string;
    amount_sats: string;
    nwc: string;
    manual_nwc: boolean;
    use_custom_emoji: boolean;
    emoji: string;
    donate_damus: boolean;
    donate_opensats: boolean;
};

type ZapplePayPayloadEmoji = {
    npub: string;
    amount_sats: number;
    auth_id?: string;
    nwc?: string;
    donations?: Array<{ amount_sats: number; npub: string }>;
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
            emoji: "🤙",
            donate_damus: false,
            donate_opensats: false
        }
    });

    const [nwaAuthId, setNwaAuthId] = createSignal<string | undefined>(
        undefined
    );

    const handleSubmit = async (f: ZappleForm) => {
        const { npub, amount_sats, nwc, emoji, donate_damus, donate_opensats } =
            f;
        setSaving(true);
        setError(undefined);

        const npubHex = nip19.decode(npub).data;

        let donations = [];

        if (donate_damus) {
            let item = {
                amount_sats: Number(amount_sats),
                npub: "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"
            };
            donations.push(item);
        }
        if (donate_opensats) {
            let item = {
                amount_sats: Number(amount_sats),
                npub: "787338757fc25d65cd929394d5e7713cf43638e8d259e8dcf5c73b834eb851f2"
            };
            donations.push(item);
        }

        const payload: ZapplePayPayloadEmoji = {
            npub: npubHex.toString(),
            amount_sats: Number(amount_sats),
            donations
        };

        try {
            if (nwaAuthId()) {
                payload.auth_id = nwaAuthId();
                console.log("using auth id", nwaAuthId());
            } else if (nwc) {
                payload.nwc = nwc;
                console.log("using nwc", nwc);
            } else {
                throw new Error("You must connect a wallet");
            }

            const res = await fetch(`https://${API_URL}/set-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            console.log(res);

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

    const nwaParams = createMemo(() => {
        const amount = getValue(zappleForm, "amount_sats");

        if (!amount) return undefined;

        // thankfully empty object is truthy!
        return {};
    });

    function handleConnectedChange(authId?: string) {
        console.log("connected change", authId);
        setNwaAuthId(authId);
        if (authId) {
            submit(zappleForm);
        }
    }

    return (
        <main>
            <Motion.section
                initial={{ transform: "scaleY(0)" }}
                inView={{ transform: "scaleY(1)" }}
                class="relative h-[100vh] w-full flex flex-col items-center justify-center  bg-primary text-background"
            >
                <CheckOut page />
                <Motion.img
                    src="/zapple-logo.svg"
                    class="mx-auto h-[270px] w-[270px]"
                ></Motion.img>
            </Motion.section>
            <Show when={!saved()}>
                <Motion.section
                    inView={{ opacity: 1 }}
                    inViewOptions={{ amount: 0.5 }}
                    initial={{ opacity: 0 }}
                    class="min-h-[100vh] p-8 max-w-xl mx-auto flex flex-col justify-center"
                >
                    <p class="mb-4">
                        Zapple Pay lets you Zap from any nostr client. Just
                        react to a <s>note</s>{" "}
                        <span class="text-xl text-primary font-semibold">
                            UnLoCkAbLe dIgItAl cOnTeNt
                        </span>{" "}
                        with a {getValue(zappleForm, "emoji")} emoji and Zapple
                        Pay will notify your lightning wallet to pay the zap.
                    </p>
                    <Form
                        onSubmit={handleSubmit}
                        class="max-w-xl flex flex-col"
                    >
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
                                }, "Please enter a valid npub")
                            ]}
                        >
                            {(field, props) => (
                                <>
                                    <label class="mb-0">your npub</label>
                                    <label class="text-sm font-normal mt-0 opacity-75">
                                        Zapple Pay will subscribe to reaction
                                        events on this npub
                                    </label>
                                    <input
                                        {...props}
                                        placeholder="npub1p4..."
                                    />
                                    {field.error && (
                                        <div class="text-red-500">
                                            {field.error}
                                        </div>
                                    )}
                                </>
                            )}
                        </Field>
                        <Show when={getValue(zappleForm, "use_custom_emoji")}>
                            <Field
                                name="emoji"
                                validate={[
                                    required("Please enter an emoji"),
                                    custom((value) => {
                                        if (isOnlyOneEmoji(value!)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }, "Please enter a valid emoji")
                                ]}
                            >
                                {(field, props) => (
                                    <>
                                        <label class="mb-0">
                                            trigger emoji
                                        </label>
                                        <label class="text-sm font-normal mt-0 opacity-75">
                                            Enter any emoji you'd like!
                                        </label>
                                        <input
                                            {...props}
                                            placeholder="your favorite emoji..."
                                        />
                                        {field.error && (
                                            <div class="text-red-500">
                                                {field.error}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Field>
                        </Show>
                        <Show
                            when={
                                getValue(zappleForm, "use_custom_emoji") ===
                                false
                            }
                        >
                            <Field name="emoji">
                                {(field, props) => (
                                    <>
                                        <label class="mb-0">
                                            trigger emoji
                                        </label>
                                        <label class="text-sm font-normal mt-0 opacity-75">
                                            Which reaction emoji do you want to
                                            trigger zaps? Damus uses 🤙 by
                                            default.
                                        </label>
                                        <select {...props}>
                                            <For
                                                each={EMOJI_OPTIONS.map((e) => {
                                                    return {
                                                        label: e,
                                                        value: e
                                                    };
                                                })}
                                            >
                                                {({ label, value }) => (
                                                    <option
                                                        value={value}
                                                        selected={
                                                            field.value ===
                                                            value
                                                        }
                                                    >
                                                        {label}
                                                    </option>
                                                )}
                                            </For>
                                        </select>
                                        {field.error && (
                                            <div class="text-red-500">
                                                {field.error}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Field>
                        </Show>
                        <Field name="use_custom_emoji" type="boolean">
                            {(field, props) => (
                                <div class={"flex gap-4 items-center"}>
                                    <input
                                        class="w-4 h-4 m-0"
                                        id={field.name}
                                        type={"checkbox"}
                                        {...props}
                                        checked={field.value}
                                    ></input>
                                    <label class="font-normal" for={field.name}>
                                        Use custom emoji
                                    </label>
                                </div>
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
                                }, "Please enter a number")
                            ]}
                        >
                            {(field, props) => (
                                <>
                                    <label class="mb-0">zap amount</label>
                                    <label class="text-sm font-normal mt-0 opacity-75">
                                        How much to zap in sats per reaction
                                    </label>
                                    <input {...props} placeholder="420" />
                                    {field.error && (
                                        <div class="text-red-500">
                                            {field.error}
                                        </div>
                                    )}
                                </>
                            )}
                        </Field>
                        <Show when={getValue(zappleForm, "amount_sats")}>
                            <div class="flex flex-col gap-4 mt-2">
                                <div class="flex flex-col">
                                    <label class="mb-0">
                                        connect your wallet
                                    </label>
                                    <label class="text-sm font-normal mt-0 opacity-75">
                                        use a nwc or nwa compatible wallet like{" "}
                                        <a href="https://app.mutinywallet.com">
                                            Mutiny
                                        </a>{" "}
                                        or{" "}
                                        <a href="https://nwc.getalby.com/">
                                            Alby
                                        </a>
                                    </label>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Show
                                        when={
                                            nwaParams() &&
                                            !getValue(
                                                zappleForm,
                                                "manual_nwc"
                                            ) &&
                                            !nwaAuthId()
                                        }
                                    >
                                        <Suspense
                                            fallback={
                                                <div class="w-full flex justify-center items-center py-4">
                                                    <LoadingSpinner wide />
                                                </div>
                                            }
                                        >
                                            <NWA
                                                nwaParams={nwaParams()!}
                                                onConnectedChange={
                                                    handleConnectedChange
                                                }
                                            />
                                        </Suspense>
                                    </Show>
                                    <Show when={!nwaAuthId()}>
                                        <Field name="manual_nwc" type="boolean">
                                            {(field, props) => (
                                                <button
                                                    onClick={() =>
                                                        setValue(
                                                            zappleForm,
                                                            "manual_nwc",
                                                            !getValue(
                                                                zappleForm,
                                                                "manual_nwc"
                                                            )
                                                        )
                                                    }
                                                    class="bg-neutral-500 px-4 py-3 rounded"
                                                    type="button"
                                                >
                                                    Manual Connect
                                                </button>
                                            )}
                                        </Field>
                                        <Show
                                            when={getValue(
                                                zappleForm,
                                                "manual_nwc"
                                            )}
                                        >
                                            <Field name="nwc">
                                                {(field, props) => (
                                                    <>
                                                        <textarea
                                                            {...props}
                                                            placeholder="nostr+walletconnect://7c30..."
                                                            rows="5"
                                                            class="w-full"
                                                        />
                                                        {field.error && (
                                                            <div class="text-red-500">
                                                                {field.error}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </Field>
                                        </Show>
                                    </Show>
                                </div>
                            </div>
                        </Show>

                        <Show
                            when={
                                (nwaAuthId() ||
                                    getValue(zappleForm, "manual_nwc")) &&
                                getValue(zappleForm, "amount_sats") &&
                                getValue(zappleForm, "npub")
                            }
                        >
                            <button
                                type="submit"
                                disabled={
                                    zappleForm.invalid || zappleForm.submitting
                                }
                                class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto disabled:opacity-25"
                            >
                                {saving() ? "SAVING..." : "SAVE"}
                            </button>
                        </Show>
                        <Show when={!!error()}>
                            <p class="text-red-500">
                                Error: {error()?.message}
                            </p>
                        </Show>
                    </Form>
                </Motion.section>
            </Show>
            <Show when={saved()}>
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
            </Show>
        </main>
    );
}
