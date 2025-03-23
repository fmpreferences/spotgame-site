<script lang="ts">
    import type { PageServerData } from "./$types";

    // I am using Svelte 5 so you can use the export let syntax if you aren't
    let { data }: { data: PageServerData } = $props();

    const game_values = data.game_values;
    const ids = game_values.map((e) => e.id);

    let response_data: any = $state(null);
    let clicked_any = $state(false);

    async function check_higher(chosen_id: string) {
        try {
            const response = await fetch("/api/1.0/get-streams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ chosen_id, ids }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            response_data = await response.json();
        } catch {
            throw new Error("MGREPS");
        }
        clicked_any = true;
    }
</script>

<div>
    {#if game_values.length > 0}
        {#each game_values as button_data}
            <button
                onclick={() => check_higher(button_data.id)}
                disabled={clicked_any}
            >
                <h1>{button_data.title}</h1>
                <h3>{button_data.artist_names}</h3>
                {#if clicked_any}
                    <div>{response_data.streamcounts[button_data.id]}</div>
                {/if}
            </button>
        {/each}
    {/if}
</div>
