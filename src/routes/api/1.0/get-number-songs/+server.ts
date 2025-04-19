import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { type GameInfo } from "$lib/types.js"

export const POST: RequestHandler = async ({ request, locals }) => {
    const { n, min_streams, min_year, max_year, active } = await request.json();

    if (n <= 0) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const loadDataPromise = new Promise<GameInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = `select distinct id from tracks
        where id in (select d.id from tracks d join buckets e on d.id = e.id where date between '${min_year}-01-01' and '${max_year}-12-31' and 
        streams >= ${min_streams} and bucket in (${active.map((e: any) => `'${e.genre}'`)}))`;

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
        count: rows.length
    });
}
