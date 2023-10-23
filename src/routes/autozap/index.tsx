import { AutoFaq } from "~/components/AutoZapFaq";

export default function AutoZapIndex() {
    function handleMakePage() {
        let npub = window.prompt("What's your npub?");
    
        if (!npub) return;
    
        window.location.href = `/autozap/${npub}`;
      }

  return (
    <div class="flex flex-col items-center gap-8 py-8">
      <h1 class="text-4xl font-semibold text-center">AutoZap</h1>
      <button
            type="button"
            onclick={handleMakePage}
            
            class="bg-primary px-8 py-4 text-black text-lg font-bold rounded self-start my-4 mx-auto disabled:opacity-25"
          >
            CREATE YOUR AUTOZAP PAGE
          </button>
      <AutoFaq />
    </div>
  );
}
