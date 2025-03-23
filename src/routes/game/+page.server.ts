import type { PageServerLoad } from './$types';
import { type GameInfo } from "$lib/types.js"


export const load: PageServerLoad = async ({ locals }) => {
    // Since `sqlite3` is a callback based system, we'll want to use a 
    // promise to return the data in an async manner.
    const loadDataPromise = new Promise<GameInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = "select distinct a.title, a.id, c.artist_name from tracks a join track_artists b on a.id = b.id join artists c on b.artist_id = c.artist_id where a.id in (select id from buckets where Bucket = 'edm' order by random() limit 2)";
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
        if (!pepega_map.has(game_info.id)) {
            pepega_map.set(game_info.id, [game_info]);
        } else {
            pepega_map.get(game_info.id).push(game_info);
        }
    });

    let res: object[] = [];
    pepega_map.forEach((game_infos: GameInfo[], id: string) => {
        const btn_data = {
            id: id,
            title: game_infos[0].title,
            artist_names: game_infos.map((e: GameInfo) => {
                return e.artist_name;
            }).join(', ')
        };
        res.push(btn_data);
    })

    return {
        game_values: res
    };
};