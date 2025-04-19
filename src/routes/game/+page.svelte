<script lang="ts">
  import type { GameInfo } from "$lib/types";
  import { onMount } from "svelte";

  let game_over = $state(false);
  let score = $state(0);

  // logic for the inputs before the game
  let pregame = $state(true);
  let pregame_error = $state("");
  let minstreams = $state(250000000);
  let n_pulls = $state(2);
  let min_year = $state(1000);
  let max_year = $state(new Date().getFullYear());

  let random_vals_promise: Promise<SongButtonOptions[]> = $state(
    Promise.resolve([])
  );
  let truthy: Map<string, string> = $state(new Map<string, string>());

  class CatBox {
    genre: string;
    checked = $state(true);

    constructor(genre: string) {
      this.genre = genre;
    }
  }

  let cats = $state(
    ["latin", "rnb", "edm", "rock", "country", "pop", "hiphop", "indie"].map(
      (e) => new CatBox(e)
    )
  );

  let active_cats = $derived(cats.filter((e) => e.checked));

  class SongButtonOptions {
    id: string = $state("");
    title: string = $state("");
    artist_names: string = $state("");
    album_art: string = $state("");
    back_color = $state("rgba(255,255,255,0.85)");
    streamcount = $state(-1);

    constructor(
      id: string,
      title: string,
      artist_names: string,
      album_art: string
    ) {
      this.id = id;
      this.title = title;
      this.artist_names = artist_names;
      this.album_art = album_art;
    }
  }

  async function validate_pregame() {
    if (min_year > max_year) {
      pregame_error = "Min Year must be lower than Max Year";
      return;
    }

    pregame = false;
  }
  async function get_random_vals() {
    const response = await fetch("/api/1.0/get-random-songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        n: n_pulls,
        min_streams: minstreams,
        min_year,
        max_year,
        active: active_cats,
      }),
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

    let btn_data: SongButtonOptions[] = [];
    unique_ids_map.forEach((game_infos: GameInfo[], id: string) => {
      const btn_d: SongButtonOptions = new SongButtonOptions(
        id,
        game_infos[0].title,
        game_infos.map((e: GameInfo) => e.artist_name).join(", "),
        game_infos[0].album_art
      );
      btn_data.push(btn_d);
    });

    truthy.clear();
    game_values.forEach((e) => truthy.set(e.id, "rgba(255,255,255,0.85)"));
    truthy = truthy;

    return new Promise<SongButtonOptions[]>((fulfil, reject) => {
      setTimeout(() => {
        if (!response.ok) {
          reject(new Error(`Error: ${response.status}`));
        }
        fulfil(btn_data);
      }, 1000);
    });
  }

  onMount(() => (random_vals_promise = get_random_vals()));

  async function check_higher(
    chosen_id: string,
    btn_data: SongButtonOptions[]
  ) {
    try {
      const response = await fetch("/api/1.0/get-streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: btn_data.map((e) => e.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      let response_data = await response.json();
      let streamcounts = response_data.streamcounts;

      btn_data.forEach((e: SongButtonOptions, i: number) => {
        e.streamcount = streamcounts[i];
        if (e.id == response_data.correct) {
          e.back_color = "rgba(0,255,0,0.85)";
        } else {
          e.back_color = "rgba(255,0,0,0.85)";
        }
      });

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
        min="250000000"
        max="1250000000"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
      <input
        type="range"
        bind:value={minstreams}
        min="250000000"
        max="1250000000"
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

    <label>
      Min Year:
      <input
        type="number"
        bind:value={min_year}
        min="1"
        max="9999"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
    </label>

    <label>
      Max Year:
      <input
        type="number"
        bind:value={max_year}
        min="1"
        max="9999"
        onchange={() => (random_vals_promise = get_random_vals())}
      />
    </label>
    <br />

    {#each cats as cat}
      <label
        ><input type="checkbox" bind:checked={cat.checked} />{cat.genre}</label
      >
    {/each}
    <br />
    <button onclick={validate_pregame}> Start! </button>
    <br />

    {#if pregame_error != ""}
      <p>{pregame_error}</p>
    {/if}
  {:else}
    {#await random_vals_promise then btn_data}
      {#each btn_data as button_data}
        <button
          class="main-btn"
          onclick={() => check_higher(button_data.id, btn_data)}
          disabled={game_over}
          style="background-image: url({button_data.album_art})"
        >
          <div class="cover" style="--result-color: {button_data.back_color}">
            <h1>{button_data.title}</h1>
            <h3>{button_data.artist_names}</h3>
            {#if button_data.streamcount >= 0}
              <h4>
                {button_data.streamcount.toLocaleString("en-US")}
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

  .cover {
    background-color: var(--result-color);
  }
</style>
