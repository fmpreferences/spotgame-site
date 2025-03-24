import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { type GameInfo } from "$lib/types.js"

export const POST: RequestHandler = async ({ request, locals }) => {
    const { n } = await request.json();

    if (n <= 0) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const loadDataPromise = new Promise<GameInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = `select distinct a.title, a.id, c.artist_name from tracks a join track_artists b on a.id = b.id join artists c on b.artist_id = c.artist_id
        where a.id in (select id from buckets where Bucket = 'edm' order by random() limit ${n})`;
        db.all<GameInfo>(query, (err: Error | null, rows: GameInfo[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    })
    const rows = await loadDataPromise;



    return json({
        random_songs: rows.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
    });
}
