import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
    const { ids } = await request.json();

    if (!ids) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const rows = await platform?.env.DB.prepare(
        `select id, streams from tracks where id in (${ids.map((e: string) => `'${e}'`)});`
    ).run();

    let max_id: string = '', max_streams = 0;
    let streamcounts: number[] = Array(ids.length);

    rows?.results.forEach((val: any) => {
        streamcounts[ids.indexOf(val.id)] = val.streams;
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
        correct: max_id,
        streamcounts: streamcounts
    });
}
