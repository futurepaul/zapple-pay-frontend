// Thanks you https://soorria.com/snippets/use-copy-solidjs
import type { Accessor } from "solid-js";
import { Show, createSignal } from "solid-js";
import { QRCodeSVG } from "solid-qr-code";
import copyBlack from "~/assets/icons/copy-black.svg";
import shareBlack from "~/assets/icons/share-black.svg";

export type UseCopyProps = {
    copiedTimeout?: number;
};
type CopyFn = (text: string) => Promise<void>;
export const useCopy = ({ copiedTimeout = 2000 }: UseCopyProps = {}): [
    copy: CopyFn,
    copied: Accessor<boolean>
] => {
    const [copied, setCopied] = createSignal(false);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const copy: CopyFn = async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => setCopied(false), copiedTimeout);
    };
    return [copy, copied];
};

function TruncateMiddle(props: { text: string; whiteBg?: boolean }) {
    return (
        <div
            class="flex font-mono"
            classList={{
                "text-black": props.whiteBg
            }}
        >
            <span class="truncate">{props.text}</span>
            <span class="pr-2">
                {props.text.length > 32 ? props.text.slice(-8) : ""}
            </span>
        </div>
    );
}

async function share(receiveString: string) {
    if (!navigator.share) {
        console.error("Share not supported");
    }
    const shareData: ShareData = {
        title: "Zapple Pay",
        text: receiveString
    };
    try {
        await navigator.share(shareData);
    } catch (e) {
        console.error(e);
    }
}

export function IntegratedQr(props: { value: string }) {
    const [copy, copied] = useCopy({ copiedTimeout: 1000 });
    return (
        <div
            id="qr"
            class="relative flex w-full flex-col items-center rounded-xl bg-white px-4"
            onClick={() => copy(props.value)}
        >
            <Show when={copied()}>
                <div class="absolute z-50 flex h-full w-full flex-col items-center justify-center rounded-xl bg-neutral-900/60 transition-all">
                    <p class="text-xl font-bold">Copied</p>
                </div>
            </Show>
            <div class="py-4"></div>
            <QRCodeSVG
                value={props.value}
                class="h-full max-h-[256px] w-full"
            />
            <div
                class="grid w-full max-w-[256px] gap-1 py-4 "
                classList={{
                    "grid-cols-[2rem_minmax(0,1fr)_2rem]": !!navigator.share,
                    "grid-cols-[minmax(0,1fr)_2rem]": !navigator.share
                }}
            >
                <Show when={!!navigator.share}>
                    <button
                        class="justify-self-start"
                        onClick={(_) => share(props.value)}
                    >
                        <img src={shareBlack} alt="share" />
                    </button>
                </Show>
                <div class="">
                    <TruncateMiddle text={props.value} whiteBg />
                </div>
                <button
                    class=" justify-self-end"
                    onClick={() => copy(props.value)}
                >
                    <img src={copyBlack} alt="copy" />
                </button>
            </div>
        </div>
    );
}
