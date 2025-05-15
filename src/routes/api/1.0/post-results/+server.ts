import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Sqids from 'sqids'

export const POST: RequestHandler = async ({ request, platform }) => {
    const { n, min_streams, min_year, max_year, enabled, song_count, easy, timestamp, results } = await request.json();

    const sq = new Sqids();

    const hashable = [].concat(...results).map((e: any) => JSON.parse(e).streamcount); 
    // console.log(hashable.join(', '));


    const id = sq.encode(hashable);

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
        PRIMARY KEY("id")
    );`
    ).run();

    // console.log(typeof (id), typeof (n), typeof (min_streams), typeof (min_year), typeof (max_year), typeof (enabled), typeof (song_count), typeof (easy?1:0), typeof (timestamp));

    await platform?.env.DB.prepare(
        `insert into leaderboard_settings values (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
        )
        .run();

    let promises = results.map(async (e: any, i: number) => {
        let promises2 = e.map(async (e1: any, j: number) => {
            e1 = JSON.parse(e1);
            // console.log(typeof (id), typeof (e1.title), typeof (e1.artist_names), typeof (e1.album_art), typeof (e1.back_color), typeof (e1.streamcount), typeof (i), typeof (j));

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
