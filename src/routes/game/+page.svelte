<script lang="ts">
    import type { BtnData, GameInfo } from "$lib/types";
    import { onMount } from "svelte";
    import type { PageProps } from "../$types";

    let { data }: PageProps = $props();

    let game_values: GameInfo[] = $state(data.game_infos);

    let streamcounts: any = $state(null);
    let game_over = $state(false);
    let score = $state(0);

    let btn_data: BtnData[] = $state(data.btn_data);

    async function populate_button_data() {
        let unique_ids_map = new Map<string, GameInfo[]>();
        game_values.forEach((game_info) => {
            if (!unique_ids_map.has(game_info.id)) {
                unique_ids_map.set(game_info.id, [game_info]);
            } else {
                unique_ids_map.get(game_info.id).push(game_info);
            }
        });

        btn_data = [];
        unique_ids_map.forEach((game_infos: GameInfo[], id: string) => {
            const btn_d: BtnData = {
                id: id,
                title: game_infos[0].title,
                artist_names: game_infos
                    .map((e: GameInfo) => {
                        return e.artist_name;
                    })
                    .join(", "),
            };
            btn_data.push(btn_d);
        });
    }

    async function get_random_vals() {
        try {
            const response = await fetch("/api/1.0/get-random-songs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ n: 2 }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const response_data = await response.json();
            game_values = response_data.random_songs;
        } catch (error) {
            console.error("Failed to fetch random:", error);
        } finally {
            await populate_button_data();
        }
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
    {#if btn_data.length > 0}
        {#each btn_data as button_data}
            <button class="main-btn"
                onclick={() => check_higher(button_data.id)}
                disabled={game_over}
            >
                <h1>{button_data.title}</h1>
                <h3>{button_data.artist_names}</h3>
                {#if streamcounts != null}
                    <h4>
                        {streamcounts[button_data.id].toLocaleString("en-US")}
                    </h4>
                {/if}
            </button>
        {/each}
    {/if}
</div>

<div>{score}</div>

{#if game_over}
    <div>YOU DIED!!!</div>
{/if}

<style>
    .main-btn {
        width: 20vw; height: 20vw;
    }
</style>