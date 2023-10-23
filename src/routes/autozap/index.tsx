import { For, createResource } from "solid-js";
import { AutoFaq } from "~/components/AutoZapFaq";
import { getNpubFromHexpub } from "./[id]";
import { CreateAutozapPage } from "~/components/CreateButton";

const PRIMAL_API = "https://primal-cache.mutinywallet.com/api";

async function fetchMostZapped() {
  try {
    const restPayload = JSON.stringify(["explore_global_mostzapped_4h"]);

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

    const justTheProfiles = data
      .filter((d: any) => d.kind === 0)
      .map((d: any) => {
        console.log(d);
        const content = JSON.parse(d.content);
        const pubkey = d.pubkey;
        const npub = getNpubFromHexpub(pubkey);
        content.npub = npub;
        return content;
      });

    console.log(justTheProfiles);
    return justTheProfiles;
  } catch (e) {
    console.error(e);
  }
}

function MiniProfiles() {
  const [mostZapped] = createResource(fetchMostZapped);

  return (
    <>
      {/* <pre class="whitespace-pre-wrap break-all">{JSON.stringify(mostZapped(), null, 2)}</pre> */}
      <div class="flex flex-col gap-4 w-full max-w-[20rem]">
        <For each={mostZapped()}>
          {(profile: any) => (
            <a
              href={`/autozap/${profile.npub}`}
              class="bg-[hsl(0,0%,10%)] flex gap-4 p-2 rounded w-full max-w-[20rem] border-2 border-primary/20 hover:border-primary"
            >
              <div class="flex flex-row items-center gap-4 bg-g">
                {/* <pre class="break-all whitespace-pre-wrap">{JSON.stringify(profile, null, 2)}</pre> */}
                <img src={profile.picture} class="w-12 h-12 rounded-full" />
                <div class="flex flex-col">
                  <span class="text-lg font-semibold">
                    {profile.name ||
                      profile.display_name ||
                      profile.displayName}
                  </span>
                </div>
              </div>
            </a>
          )}
        </For>
      </div>
    </>
  );
}

export default function AutoZapIndex() {
  return (
    <div class="flex flex-col items-center gap-4 py-8">
      <h1 class="text-4xl font-semibold text-center">AutoZap</h1>
      <CreateAutozapPage />
      <div class="w-full max-w-[20rem] bg-[hsl(0,0%,10%)] rounded p-4">
        <p class="text-center text-lg">
          (everyone's page is located at <code>zapplepay.com/autozap/NPUB</code>
          )
        </p>
      </div>
      <h2 class="text-2xl font-semibold text-center">
        TRENDING <span class="text-primary">ZAPPEES</span>
      </h2>

      <MiniProfiles />

      <AutoFaq />
    </div>
  );
}
