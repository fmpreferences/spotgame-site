import type { PageLoad } from './$types';
import { type BtnData, type GameInfo } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
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

        const game_infos = await response.json();
        let game_values: GameInfo[] = game_infos.random_songs;
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
            };
            btn_data.push(btn_d);
        });


        return {
            game_infos: game_values,
            btn_data
        };
    } catch (error) {
        console.error('Failed to fetch random:', error);
        return {
            game_infos: [],
            error: 'Failed to fetch random. Please try again later.'
        };
    }
};