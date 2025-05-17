import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Sqids from 'sqids'
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, platform }) => {
    const { n, min_streams, min_year, max_year, enabled, song_count, easy, timestamp, results } = await request.json();

    const sq = new Sqids();

    // const hashable = [].concat(...results.map((e: any) => e.slice(0, 2))).slice(0, 8).map((e: any) => JSON.parse(e).streamcount % 1048576);


    const id = nanoid();

    await platform?.env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS "leaderboard"  (
        "id"	TEXT,
        "title"	TEXT,
        "artist_names"	TEXT,
        "album_art"	TEXT,
        "back_color"	TEXT,
        "streamcount"	INTEGER,
        "index"	INTEGER,
        "song_index"	INTEGER
    );
    CREATE TABLE IF NOT EXISTS "leaderboard_settings" (
        "id"	TEXT,
        "n"	INTEGER,
        "min_streams"	INTEGER,
        "min_year"	INTEGER,
        "max_year"	INTEGER,
        "enabled"	TEXT,
        "song_count"	INTEGER,
        "easy"	INTEGER,
        "timestamp"	TEXT,
        "username"	TEXT,
        PRIMARY KEY("id")
    );`
    ).run();


    await platform?.env.DB.prepare(
        `insert into leaderboard_settings values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    )
        .bind(
            id,
            n,
            min_streams,
            min_year,
            max_year,
            enabled,
            song_count,
            easy ? 1 : 0,
            timestamp,
            'admin',
        )
        .run();

    let promises = results.map(async (e: any, i: number) => {
        let promises2 = e.map(async (e1: any, j: number) => {
            e1 = JSON.parse(e1);
            await platform?.env.DB.prepare(
                `insert into leaderboard values (?, ?, ?, ?, ?, ?, ?, ?);`,
            )
                .bind(
                    id,
                    e1.title,
                    e1.artist_names,
                    e1.album_art,
                    e1.back_color,
                    e1.streamcount,
                    i,
                    j,
                )
                .run();
        });
        await Promise.all(promises2);
    });

    await Promise.all(promises);


    return json({
        success: true,
    });
}
