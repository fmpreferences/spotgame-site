import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { type StreamInfo } from "$lib/types.js"

export const POST: RequestHandler = async ({ request, locals }) => {
    const { chosen_id, ids } = await request.json();

    if (!ids) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const loadDataPromise = new Promise<StreamInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = `select id, streams from tracks where id in (${ids.map((e: string) => `'${e}'`).join(',')});`
        db.all<StreamInfo>(query, (err: Error | null, rows: StreamInfo[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });

    const rows = await loadDataPromise;
    let max_id: string = '', max_streams = 0;
    let streamcounts: Record<string, number> = {};
    rows.forEach((val: StreamInfo) => {
        streamcounts[val.id] = val.streams;
        if (val.streams > max_streams) {
            max_id = val.id;
            max_streams = val.streams;
        }
    });

    if (max_id == '') {
        // error
    }
    return json({
        success: true,
        correct: max_id == chosen_id,
        streamcounts: streamcounts
    });
}
