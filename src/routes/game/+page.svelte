<script lang="ts">
    import type { PageServerData } from "./$types";

    // I am using Svelte 5 so you can use the export let syntax if you aren't
    let { data }: { data: PageServerData } = $props();

    const game_values = data.game_values;
</script>

<div>
    {#if game_values.length > 0}
        {#each game_values as button_data}
            <div>
                <h1>{button_data.title}</h1>
                <p>{button_data.artist_names}</p>
            </div>
        {/each}
    {/if}
</div>
