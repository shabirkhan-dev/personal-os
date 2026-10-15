import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { SqlDriver, SqlValue } from "./driver";

/** The app's SQLite file, opened once with WAL so reads never wait on a write. */
export async function openExpoDriver(name = "personal-os.db"): Promise<SqlDriver> {
	const db = await openDatabaseAsync(name);
	await db.execAsync("PRAGMA journal_mode = WAL;");
	return expoDriver(db);
}

function expoDriver(db: SQLiteDatabase): SqlDriver {
	return {
		exec: (sql) => db.execAsync(sql),
		run: async (sql, params = []) => {
			await db.runAsync(sql, params as SqlValue[]);
		},
		all: <T>(sql: string, params: readonly SqlValue[] = []) =>
			db.getAllAsync<T>(sql, params as SqlValue[]),
		transaction: (task) => db.withTransactionAsync(task),
	};
}
