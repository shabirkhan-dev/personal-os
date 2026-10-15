/// <reference types="bun" />
import { Database } from "bun:sqlite";
import type { SqlDriver, SqlValue } from "../driver";

/** In-memory SQLite for tests, behind the same interface as the app's expo-sqlite driver. */
export function memoryDriver(): SqlDriver {
	const db = new Database(":memory:");
	return {
		exec: async (sql) => {
			db.exec(sql);
		},
		run: async (sql, params = []) => {
			db.query(sql).run(...(params as SqlValue[]));
		},
		all: async <T>(sql: string, params: readonly SqlValue[] = []) =>
			db.query(sql).all(...(params as SqlValue[])) as T[],
		transaction: async (task) => {
			db.exec("BEGIN");
			try {
				await task();
				db.exec("COMMIT");
			} catch (error) {
				db.exec("ROLLBACK");
				throw error;
			}
		},
	};
}
