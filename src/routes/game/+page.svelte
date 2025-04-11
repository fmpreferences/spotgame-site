<script lang="ts">
  import type { BtnData, GameInfo } from "$lib/types";
  import { onMount } from "svelte";

  let streamcounts: any = $state(null);
  let game_over = $state(false);
  let score = $state(0);

  // logic for the inputs before the game
  let pregame = $state(true);
  let minstreams = $state(300000000);
  let n_pulls = $state(2);

  let random_vals_promise: Promise<BtnData[]> = $state(Promise.resolve([]));
  let truthy: Map<string, string> = $state(new Map<string, string>());

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
        artist_names: game_infos.map((e: GameInfo) => e.artist_name).join(", "),
        album_art: game_infos[0].album_art,
      };
      btn_data.push(btn_d);
    });

    truthy.clear();
    game_values.forEach((e) => truthy.set(e.id, "neutral-cover"));
    truthy = truthy;

    return new Promise<BtnData[]>((fulfil, reject) => {
      setTimeout(() => {
        if (!response.ok) {
          reject(new Error(`Error: ${response.status}`));
        }
        fulfil(btn_data);
      }, 1000);
    });
  }

  onMount(() => (random_vals_promise = get_random_vals()));

  async function check_higher(chosen_id: string, btn_data: BtnData[]) {
    try {
      const response = await fetch("/api/1.0/get-streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [...new Set(btn_data.map((e) => e.id))],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      let response_data = await response.json();
      streamcounts = response_data.streamcounts;

      btn_data.forEach((e: any) => {
        if (e.id == response_data.correct) {
          truthy.set(e.id, "correct-cover");
        } else {
          truthy.set(e.id, "incorrect-cover");
        }
      });

      truthy = truthy;

      if (response_data.correct == chosen_id) {
        score += 1;
        let promise = get_random_vals();
        await new Promise((res) => setTimeout(res, 2000));
        streamcounts = null;
        random_vals_promise = promise;
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
        min="300000000"
        max="1300000000"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
      <input
        type="range"
        bind:value={minstreams}
        min="300000000"
        max="1300000000"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
    </label>

    <br />

    <label>
      Songs per Round:
      <input
        type="number"
        bind:value={n_pulls}
        min="2"
        max="10"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
      <input
        type="range"
        bind:value={n_pulls}
        min="2"
        max="10"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
    </label>

    <br />

    <button onclick={() => (pregame = false)}> Start! </button>
  {:else}
    {#await random_vals_promise then btn_data}
      {#each btn_data as button_data}
        <button
          class="main-btn"
          onclick={() => check_higher(button_data.id, btn_data)}
          disabled={game_over}
          style="background-image: url({button_data.album_art})"
        >
          <div class={truthy.get(button_data.id)}>
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

  .neutral-cover {
    background-color: rgba(255, 255, 255, 0.85);
  }

  .correct-cover {
    background-color: rgba(0, 255, 0, 0.85);
  }

  .incorrect-cover {
    background-color: rgba(255, 0, 0, 0.85);
  }
</style>
