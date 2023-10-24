import { Show } from "solid-js";

export function CheckOut(props: { page?: boolean }) {
  return (
    <>
      <a
        href="/autozap/"
        class="z-10 text-white justify-center flex flex-col items-center text-center font-bold rotate-12 absolute w-[10rem] h-[10rem] bg-black right-[1rem] top-[1rem] rounded-full"
        classList={{ "w-[7rem] h-[7rem]": !props.page }}
      >
        <Show when={!props.page}>
          Explore <span class="underline font-black">AutoZaps!</span>
        </Show>
        <Show when={props.page}>
          Check out <span class="underline font-black">AutoZaps!</span>
        </Show>
      </a>
      <div 
      class="animate-[shadowbounce_2s_ease-in-out_infinite] z-5 absolute w-[10rem] h-[10rem] bg-black/30 right-[0.75rem] top-[1.25rem] rounded-full"
        classList={{ "w-[7rem] h-[7rem]": !props.page }}
      ></div>
    </>
  );
}
