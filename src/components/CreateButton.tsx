import { Form, createForm, custom, required } from "@modular-forms/solid";
import { nip19 } from "nostr-tools";
import { Show, createSignal } from "solid-js";
import { Header, VStack } from "~/components";

type CreateFormType = {
  npub: string;
};

export function CreateAutozapPage() {
  const [showForm, setShowForm] = createSignal(false);
  const [autoForm, { Form, Field }] = createForm<CreateFormType>({
    initialValues: {
      npub: "",
    },
  });

  function handleSubmit(f: CreateFormType) {
    let npub = f.npub;
    window.location.href = `/autozap/${npub}`;
  }

  return (
    <>
      <Show when={!showForm()}>
        <button
          type="button"
          onclick={() => setShowForm(true)}
          class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto disabled:opacity-25"
        >
          CREATE YOUR AUTOZAP PAGE
        </button>
      </Show>
      <Show when={showForm()}>
        <Form onSubmit={handleSubmit} class="w-full max-w-[20rem]">
          <Field
            name="npub"
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
          <button
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto disabled:opacity-25"
            type="submit"
          >
            CREATE
          </button>
        </Form>
      </Show>
    </>
  );
}
