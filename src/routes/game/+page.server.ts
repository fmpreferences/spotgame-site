import type { PageServerLoad } from './$types';
import { type GameInfo } from "$lib/types.js"


export const load: PageServerLoad = async ({ locals }) => {
    // Since `sqlite3` is a callback based system, we'll want to use a 
    // promise to return the data in an async manner.
    const loadDataPromise = new Promise<GameInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = "select distinct a.Title, a.ID, c.ArtistName from tracks a join track_artists b on a.ID = b.ID join artists c on b.ArtistID = c.ArtistID where a.ID in (select ID from buckets where Bucket = 'edm' order by random() limit 2)";
        db.all<GameInfo>(query, (err: Error | null, rows: GameInfo[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    })
    const rows = await loadDataPromise;

    // pepega
    let pepega_map = new Map<string, GameInfo[]>();
    rows.forEach((game_info: GameInfo) => {
        if (!pepega_map.has(game_info.ID)) {
            pepega_map.set(game_info.ID, [game_info]);
        } else {
            pepega_map.get(game_info.ID).push(game_info);
        }
    });

    let res: object[] = [];
    pepega_map.forEach((game_infos: GameInfo[], id: string) => {
        console.log(id, game_infos);
        const btn_data = {
            id: id,
            title: game_infos[0].Title,
            artist_names: game_infos.map((e: GameInfo) => {
                return e.ArtistName;
            }).join(',')
        };
        res.push(btn_data);
    })

    return {
        game_values: res
    };
};