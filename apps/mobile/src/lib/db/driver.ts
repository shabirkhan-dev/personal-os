/** A SQL value the drivers can bind. */
export type SqlValue = string | number | null;

/**
 * The few SQLite calls the record store needs. The app uses `expo-sqlite` (`expo-driver.ts`);
 * tests use `bun:sqlite`, so the store and the sync engine are tested against real SQLite.
 */
export interface SqlDriver {
	exec(sql: string): Promise<void>;
	run(sql: string, params?: readonly SqlValue[]): Promise<void>;
	all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
	/** Runs `task` inside BEGIN/COMMIT, rolling back if it throws. */
	transaction(task: () => Promise<void>): Promise<void>;
}
