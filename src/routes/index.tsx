import { createForm } from "@modular-forms/solid";
import { Motion } from "@motionone/solid";

type ZappleForm = {
  npub: string;
  amount_sats: string;
  nwc: string;
};

export default function Home() {
  const [zappleForm, { Form, Field }] = createForm<ZappleForm>({
    initialValues: {
      npub: "",
      amount_sats: "",
      nwc: "",
    },
  });

  const handleSubmit = async (f: ZappleForm) => {};

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
          with a ⚡️ emoji and Zapple Pay will notify your lightning wallet over
          NWC to pay the zap.
        </p>
        <Form onSubmit={handleSubmit} class="max-w-xl flex flex-col">
          <Field name="npub">
            {(field, props) => (
              <>
                <label>npub</label>
                <input {...props} placeholder="npub1p4..." />
              </>
            )}
          </Field>
          <Field name="amount_sats">
            {(field, props) => (
              <>
                <label>zap amount (in sats)</label>
                <input {...props} placeholder="420" />
              </>
            )}
          </Field>
          <Field name="nwc">
            {(field, props) => (
              <>
                <label>nwc connection string</label>
                <textarea
                  {...props}
                  placeholder="nostr+walletconnect://7c30..."
                  rows="5"
                />
              </>
            )}
          </Field>
          <button
            type="submit"
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto"
          >
            SAVE
          </button>
        </Form>
      </Motion.section>
    </main>
  );
}
