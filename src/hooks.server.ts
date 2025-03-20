// https://theofficialurban.medium.com/working-with-sqlite-in-sveltekit-9687e6eaf063
import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.locals.db) {
    // This will create the database within the `db.sqlite` file.
    const db = new sqlite3.Database('somewhereonmyvps.sqlite3');
    // Set the db as our events.db variable.
    event.locals.db = db
  }
  const resp = await resolve(event);
  return resp;
};