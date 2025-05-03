import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
    const { n, min_streams, min_year, max_year, active } = await request.json();

    if (n <= 0) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const rows = await platform?.env.DB.prepare(
        `select distinct id from tracks
        where id in (select d.id from tracks d join buckets e on d.id = e.id where date between ? and ? and 
        streams >= ? and bucket in (${active.map((e: any) => `'${e.genre}'`)}))`
    ).bind(`${min_year}-01-01`, `${max_year}-12-31`, min_streams).run();

    return json({
        count: rows?.results.length
    });
}
