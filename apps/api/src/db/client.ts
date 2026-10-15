import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type DatabaseHandle = { db: Database; close: () => Promise<void> };

/**
 * One connection set per request. On Workers the URL is Hyperdrive's, which pools and keeps the
 * real connections to Neon warm, so opening here is cheap.
 */
export function openDatabase(url: string): DatabaseHandle {
	const client = postgres(url, { max: 5, fetch_types: false, prepare: true });
	return { db: drizzle(client, { schema }), close: () => client.end({ timeout: 5 }) };
}
