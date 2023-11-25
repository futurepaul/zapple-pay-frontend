import { eify } from "~/utils/eify";

const API_URL = import.meta.env.VITE_ZAPPLE_API_URL;

export async function fetchNwaStatus(nwaResponse: { id: string; uri: string }) {
    try {
        console.log("fetching nwa status for id", nwaResponse.id);
        const response = await fetch(
            `https://${API_URL}/check-wallet-auth?id=${nwaResponse.id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get NWA status`);
        }

        const data = await response.json();
        console.log("nwa status", data);
        return data;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export type CreateNWAParams = {
    amount?: string;
    time_period?: string;
    identity?: string;
};

export async function createNwa({
    amount,
    time_period,
    identity
}: CreateNWAParams) {
    console.log("creating nwa", amount, time_period, identity);

    // If we have an amount we must also have a time_period, if we have a time_period we must also have an amount
    if ((amount && !time_period) || (!amount && time_period)) {
        throw new Error("Invalid amount or time_period");
    }

    let params = undefined;

    // We'll do params in the case of a budget
    if (amount && time_period) {
        params = new URLSearchParams({
            amount,
            time_period
        });
    }

    if (identity) {
        params = params || new URLSearchParams();
        params.append("identity", identity);
    }

    try {
        const response = await fetch(
            `https://${API_URL}/wallet-auth${
                params ? `?${params.toString()}` : ""
            }`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get Nostr Wallet Auth details`);
        }

        // {
        //   "id": "hex encoded id",
        //   "uri": "nostr+walletauth://blahblah"
        // }
        const data = await response.json();

        return data;
    } catch (e) {
        console.error(e);
        throw new Error(eify(e).message);
    }
}
