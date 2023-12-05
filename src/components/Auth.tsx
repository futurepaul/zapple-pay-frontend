import { Show, createEffect, createResource, onCleanup } from "solid-js";
import { CreateNWAParams, createNwa, fetchNwaStatus } from "~/api/walletAuth";
import { IntegratedQr } from "./IntegratedQr";

export function NWA(props: {
    nwaParams: CreateNWAParams;
    onConnectedChange: (authId?: string) => void;
}) {
    // When we mount we want to reset the "connected" state
    props.onConnectedChange(undefined);

    const [nwaResponse] = createResource(() => props.nwaParams, createNwa);
    const [nwaConnected, { refetch }] = createResource(
        nwaResponse,
        fetchNwaStatus
    );

    const refetchInterval = setInterval(() => {
        refetch();
    }, 3000);

    onCleanup(() => {
        clearInterval(refetchInterval);
    });

    createEffect(() => {
        if (nwaConnected.latest && nwaResponse.latest) {
            props.onConnectedChange(nwaResponse()?.id);
        } else {
            props.onConnectedChange(undefined);
        }
    });

    function handleOpenMutinyNWA() {
        // open mutiny in a new window
        const uri = nwaResponse()?.uri;
        const encodedUri = encodeURIComponent(uri);
        window.open(
            `https://app.mutinywallet.com/settings/connections?nwa=${encodedUri}`,
            "_blank"
        );
    }
    return (
        <Show when={nwaResponse() && nwaResponse.latest}>
            <IntegratedQr value={nwaResponse()?.uri} />
            <label class="text-sm font-normal mt-0 opacity-75">
                <p>
                    Scan this code with an NWA-compatible wallet like{" "}
                    <a href="https://app.mutinywallet.com">Mutiny</a>.
                </p>
            </label>
            <button
                onClick={handleOpenMutinyNWA}
                class="bg-[#E53254] px-4 py-3 rounded disabled:opacity-25"
                type="button"
            >
                Open in Mutiny Wallet
            </button>
        </Show>
    );
}
