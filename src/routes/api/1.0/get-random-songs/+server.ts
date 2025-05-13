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

    if (n > 256) {
        return new Response(JSON.stringify({ error: 'Too many requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const rows = await platform?.env.DB.prepare(
        `select distinct a.title, a.id, artist_name, album_art, artist_index, date from tracks a join track_artists b on a.id = b.id join artists c on b.artist_id = c.artist_id
        where a.id in (select distinct d.id from tracks d join buckets e on d.id = e.id where date between ? and ? and 
        streams >= ? and bucket in (${active.map((e: any) => `'${e.genre}'`)}) order by random() limit ?)`
    ).bind(`${min_year}-01-01`, `${max_year}-12-31`, min_streams, n).run();

    return json({
        random_songs: rows?.results.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value).sort((a, b) => a.artist_index - b.artist_index)
    });
}
