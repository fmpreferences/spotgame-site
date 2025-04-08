<script lang="ts">
  import type { BtnData, GameInfo } from "$lib/types";
  // import type { PageProps } from "../$types";

  // let { data }: PageProps = $props();

  let game_values: GameInfo[] = $state([]);

  let streamcounts: any = $state(null);
  let game_over = $state(false);
  let score = $state(0);

  // logic for the inputs before the game
  let pregame = $state(true);
  let minstreams = $state(250000000);
  let n_pulls = $state(2);

  async function get_random_vals() {
    const response = await fetch("/api/1.0/get-random-songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ n: n_pulls, min_streams: minstreams }),
    });

    const response_data = await response.json();
    let game_values: GameInfo[] = response_data.random_songs;

    const response2 = await fetch("/api/1.0/get-album-art", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: [...new Set(game_values.map((e) => e.id))],
      }),
    });

    const response2_data = await response2.json();
    let album_art_info = response2_data.album_art_info;

    let unique_ids_map = new Map<string, GameInfo[]>();
    game_values.forEach((game_info) => {
      if (!unique_ids_map.has(game_info.id)) {
        unique_ids_map.set(game_info.id, [game_info]);
      } else {
        unique_ids_map.get(game_info.id).push(game_info);
      }
    });

    let btn_data: BtnData[] = [];
    unique_ids_map.forEach((game_infos: GameInfo[], id: string) => {
      const btn_d: BtnData = {
        id: id,
        title: game_infos[0].title,
        artist_names: game_infos
          .map((e: GameInfo) => {
            return e.artist_name;
          })
          .join(", "),
        album_art: album_art_info[id],
      };
      btn_data.push(btn_d);
    });

    console.log(btn_data);

    return new Promise<BtnData[]>((fulfil, reject) => {
      setTimeout(() => {
        if (!response.ok) {
          reject(new Error(`Error: ${response.status}`));
        }
        fulfil(btn_data);
      }, 1000);
    });
  }

  async function check_higher(chosen_id: string) {
    try {
      const response = await fetch("/api/1.0/get-streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chosen_id,
          ids: [...new Set(game_values.map((e) => e.id))],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      let response_data = await response.json();
      streamcounts = response_data.streamcounts;
      if (response_data.correct) {
        score += 1;
        await new Promise((res) => setTimeout(res, 3500));
        streamcounts = null;
        get_random_vals();
      } else {
        game_over = true;
      }
    } catch {
      throw new Error("");
    }
  }
</script>

<div>
  {#if pregame}
    <label>
      Max Streams:
      <input
        type="number"
        bind:value={minstreams}
        min="250000000"
        max="3000000000"
      />
      <input
        type="range"
        bind:value={minstreams}
        min="250000000"
        max="3000000000"
      />
    </label>

    <br />

    <label>
      Songs per Round:
      <input type="number" bind:value={n_pulls} min="2" max="10" />
      <input type="range" bind:value={n_pulls} min="2" max="10" />
    </label>

    <br />

    <button
      onclick={() => {
        pregame = false;
      }}
    >
      Start!
    </button>
  {:else}
    {#await get_random_vals() then btn_data}
      {#each btn_data as button_data}
        <button
          class="main-btn"
          onclick={() => check_higher(button_data.id)}
          disabled={game_over}
          style="background-image: url({button_data.album_art})"
        >
          <div class="white-cover">
            <h1>{button_data.title}</h1>
            <h3>{button_data.artist_names}</h3>
            {#if streamcounts != null}
              <h4>
                {streamcounts[button_data.id].toLocaleString("en-US")}
              </h4>
            {/if}
          </div>
        </button>
      {/each}
    {/await}

    <div>{score}</div>

    {#if game_over}
      <div>YOU DIED!!!</div>
    {/if}
  {/if}
</div>

<style>
  .main-btn {
    width: 640px;
    height: 640px;
  }

  .white-cover {
    background-color: rgba(255, 255, 255, 0.85);
  }
</style>
