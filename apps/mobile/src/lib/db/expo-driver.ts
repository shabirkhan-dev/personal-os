import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { defaultDatabaseDirectory, openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";
import * as SecureStore from "@/lib/secure-store";
import type { SqlDriver, SqlValue } from "./driver";

/**
 * The app's SQLite file, encrypted with SQLCipher (`useSQLCipher` in app.json) and opened with
 * WAL so reads never wait on a write.
 *
 * - The key is 32 random bytes kept in the phone's keystore (SecureStore), never in the file.
 * - A database from before encryption is copied into an encrypted one once (`sqlcipher_export`),
 *   then the plain file is deleted. If that can't be done, the plain one keeps working and the
 *   move is tried again on the next launch: data is never dropped to get encryption.
 * - Without SQLCipher (web, or a build without the plugin) the file opens as before.
 */

const KEY_NAME = "personal-os.db.key";
const ENCRYPTED_FLAG = "personal-os.db.encrypted";

export async function openExpoDriver(name = "personal-os.db"): Promise<SqlDriver> {
	if (Platform.OS === "web") return expoDriver(await openPlain(name));
	const key = await databaseKey();
	const db = await openEncrypted(name, key);
	await db.execAsync("PRAGMA journal_mode = WAL;");
	return expoDriver(db);
}

async function openPlain(name: string): Promise<SQLiteDatabase> {
	const db = await openDatabaseAsync(name);
	await db.execAsync("PRAGMA journal_mode = WAL;");
	return db;
}

/** The hex key, made the first time. */
async function databaseKey(): Promise<string> {
	const stored = await SecureStore.getItemAsync(KEY_NAME);
	if (stored && /^[0-9a-f]{64}$/.test(stored)) return stored;
	const bytes = Crypto.getRandomBytes(32);
	const key = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
	await SecureStore.setItemAsync(KEY_NAME, key);
	return key;
}

const keyPragma = (key: string, schema = "") =>
	`PRAGMA ${schema ? `${schema}.` : ""}key = "x'${key}'";`;

async function hasCipher(db: SQLiteDatabase): Promise<boolean> {
	try {
		const row = await db.getFirstAsync<{ cipher_version?: string }>("PRAGMA cipher_version;");
		return Boolean(row?.cipher_version);
	} catch (error) {
		// Plain SQLite has no cipher_version pragma: that's the answer, not a failure.
		console.info("[db] SQLCipher isn't in this build", error);
		return false;
	}
}

function fileOf(name: string): File {
	const directory = String(defaultDatabaseDirectory ?? "");
	const uri = directory.startsWith("file://") ? directory : `file://${directory}`;
	return new File(`${uri.replace(/\/$/, "")}/${name}`);
}

const pathOf = (file: File) => decodeURIComponent(file.uri.replace(/^file:\/\//, ""));

function remove(name: string): void {
	for (const suffix of ["", "-wal", "-shm"]) {
		const file = fileOf(`${name}${suffix}`);
		if (file.exists) file.delete();
	}
}

async function openEncrypted(name: string, key: string): Promise<SQLiteDatabase> {
	const encrypted = (await SecureStore.getItemAsync(ENCRYPTED_FLAG)) === "1";
	if (!encrypted && fileOf(name).exists) {
		const moved = await encryptExisting(name, key).catch((error: unknown) => {
			console.error("[db] could not encrypt the database yet; it stays as it is", error);
			return false;
		});
		if (!moved) return openPlain(name);
	}
	const db = await openDatabaseAsync(name);
	if (!(await hasCipher(db))) return db;
	await db.execAsync(keyPragma(key));
	try {
		// The first read checks the key: a file that doesn't open with it isn't ours to read.
		await db.getFirstAsync("SELECT count(*) AS n FROM sqlite_master;");
	} catch (error) {
		console.error(
			"[db] the database doesn't open with this phone's key; starting a new one",
			error,
		);
		await db.closeAsync();
		const unreadable = fileOf(name);
		if (unreadable.exists) unreadable.move(fileOf(`${name}.unreadable-${Date.now()}`));
		remove(name);
		const fresh = await openDatabaseAsync(name);
		await fresh.execAsync(keyPragma(key));
		await SecureStore.setItemAsync(ENCRYPTED_FLAG, "1");
		return fresh;
	}
	await SecureStore.setItemAsync(ENCRYPTED_FLAG, "1");
	return db;
}

/** Copies the plain database into an encrypted one and swaps them. False without SQLCipher. */
async function encryptExisting(name: string, key: string): Promise<boolean> {
	const plain = await openDatabaseAsync(name);
	if (!(await hasCipher(plain))) {
		await plain.closeAsync();
		return false;
	}
	const target = `${name}.encrypting`;
	remove(target);
	try {
		const version = await plain.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
		await plain.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
		await plain.execAsync(
			`ATTACH DATABASE '${pathOf(fileOf(target)).replace(/'/g, "''")}' AS secure KEY "x'${key}'";`,
		);
		await plain.execAsync("SELECT sqlcipher_export('secure');");
		await plain.execAsync(`PRAGMA secure.user_version = ${Number(version?.user_version ?? 0)};`);
		await plain.execAsync("DETACH DATABASE secure;");
	} finally {
		await plain.closeAsync();
	}
	remove(name);
	fileOf(target).move(fileOf(name));
	remove(target);
	await SecureStore.setItemAsync(ENCRYPTED_FLAG, "1");
	return true;
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
