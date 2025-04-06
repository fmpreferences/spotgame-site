import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { type AlbumArtInfo } from "$lib/types.js"

export const POST: RequestHandler = async ({ request, locals }) => {
    const { ids } = await request.json();

    if (!ids) {
        return new Response(JSON.stringify({ error: 'Nothing is requested!' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const loadDataPromise = new Promise<AlbumArtInfo[]>((resolve, reject) => {
        const db = locals.db;
        const query = `select id, album_art from tracks where id in (${ids.map((e: string) => `'${e}'`).join(',')});`
        db.all<AlbumArtInfo>(query, (err: Error | null, rows: AlbumArtInfo[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });

    const rows = await loadDataPromise;
    let album_art_info: Record<string, string> = {};
    rows.forEach((val: AlbumArtInfo) => {
        album_art_info[val.id] = val.album_art;
    });

    return json({
        success: true,
        album_art_info
    });
}
