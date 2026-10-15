import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { TEST_DATABASE_URL } from "./support";

/** A clean schema with every migration applied, once per run. */
export default async function setup(): Promise<void> {
	const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => undefined });
	try {
		await client`drop schema if exists public cascade`;
		await client`drop schema if exists drizzle cascade`;
		await client`create schema public`;
		await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
	} finally {
		await client.end();
	}
}
