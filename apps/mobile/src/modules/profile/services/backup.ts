import Constants from "expo-constants";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getRecordStore } from "@/lib/db/database";
import { readJson, writeJson } from "@/lib/storage/json-file";
import * as SecureStore from "@/lib/secure-store";
import { mergeStoredAnswers, pickAnswers } from "@/modules/onboarding/store/answers-storage";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { forgetPlans } from "@/modules/reminders/services/reminder-engine";
import { rescheduleAll } from "@/modules/reminders/services/reschedule-all";
import {
	type BackupFile,
	backupsToPrune,
	localPhotoPaths,
	parseBackup,
	planRestore,
	type RestoreMode,
	rewriteRoot,
	safeRelativePath,
} from "../lib/backup";
import { buildExport, EXPORT_DOCUMENTS, exportFileName } from "../lib/export";

/**
 * Backup and restore of everything on this phone: one JSON file with the setup answers, every
 * module document and record, and (optionally) the photos. Saved to a folder the person picks
 * (Downloads, Drive…) or shared; restored by picking the file again, merging or replacing.
 */

const MIME = "application/json";
const AUTO_KEY = "personal-os.backup.auto";
const DAY_MS = 24 * 60 * 60 * 1000;

export type AutoBackup = {
	on: boolean;
	/** The folder picked for automatic backups (a content:// tree on Android). */
	folder: string | null;
	photos: boolean;
	lastAt: string | null;
	lastError: string | null;
};

const AUTO_DEFAULT: AutoBackup = {
	on: false,
	folder: null,
	photos: false,
	lastAt: null,
	lastError: null,
};

export async function loadAutoBackup(): Promise<AutoBackup> {
	try {
		const raw = await SecureStore.getItemAsync(AUTO_KEY);
		return raw ? { ...AUTO_DEFAULT, ...(JSON.parse(raw) as Partial<AutoBackup>) } : AUTO_DEFAULT;
	} catch (error) {
		console.warn("[backup] could not read the automatic backup setting", error);
		return AUTO_DEFAULT;
	}
}

export async function saveAutoBackup(change: Partial<AutoBackup>): Promise<AutoBackup> {
	const next = { ...(await loadAutoBackup()), ...change };
	await SecureStore.setItemAsync(AUTO_KEY, JSON.stringify(next));
	return next;
}

async function readDocuments(): Promise<Record<string, unknown>> {
	const entries = await Promise.all(
		EXPORT_DOCUMENTS.map(async (name): Promise<[string, unknown]> => {
			try {
				return [name, await readJson(name)];
			} catch (error) {
				console.error(`[backup] could not read ${name}`, error);
				return [name, null];
			}
		}),
	);
	return Object.fromEntries(entries);
}

async function readPhotos(paths: readonly string[]): Promise<Record<string, string>> {
	const photos: Record<string, string> = {};
	for (const path of paths) {
		const file = new File(Paths.document, path);
		if (!file.exists) continue;
		try {
			// One photo at a time keeps memory flat on big libraries.
			// oxlint-disable-next-line eslint/no-await-in-loop
			photos[path] = await file.base64();
		} catch (error) {
			console.warn(`[backup] skipped a photo that couldn't be read: ${path}`, error);
		}
	}
	return photos;
}

export type BuiltBackup = { name: string; json: string; records: number; photos: number };

/** Everything on this phone as one backup file. */
export async function buildBackup(options: {
	photos: boolean;
	themePreference: string;
	now?: Date;
}): Promise<BuiltBackup> {
	const now = options.now ?? new Date();
	const documents = await readDocuments();
	const records = await (await getRecordStore()).all();
	const base = buildExport({
		exportedAt: now,
		appVersion: Constants.expoConfig?.version ?? null,
		answers: pickAnswers(useOnboardingStore.getState()),
		documents,
		records,
		themePreference: options.themePreference,
	});
	const root = documentsRoot();
	const photos = options.photos
		? await readPhotos(localPhotoPaths({ records, documents }, root))
		: {};
	const file: BackupFile = { ...base, format: 3, photoRoot: root, photos };
	return {
		name: exportFileName(now).replace("personal-os-", "personal-os-backup-"),
		json: JSON.stringify(file),
		records: Object.values(records).reduce((sum, list) => sum + list.length, 0),
		photos: Object.keys(photos).length,
	};
}

async function writeCacheFile(name: string, json: string): Promise<File> {
	const file = new File(Paths.cache, name);
	if (file.exists) file.delete();
	file.create({ intermediates: true });
	await file.write(json);
	return file;
}

/** The documents folder as a link prefix, always ending in a slash. */
function documentsRoot(): string {
	const uri = Paths.document.uri;
	return uri.endsWith("/") ? uri : `${uri}/`;
}

/** Opens the share sheet with the backup file (Drive, email, Files…). */
export async function shareBackup(backup: BuiltBackup): Promise<void> {
	const file = await writeCacheFile(backup.name, backup.json);
	if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available here");
	await Sharing.shareAsync(file.uri, {
		mimeType: MIME,
		dialogTitle: "Save your backup",
		UTI: "public.json",
	});
}

/** Asks for a folder and writes the backup there. Returns the folder, or null when cancelled. */
export async function saveBackupToFolder(backup: BuiltBackup): Promise<string | null> {
	let folder: Directory;
	try {
		folder = await Directory.pickDirectoryAsync();
	} catch (error) {
		console.info("[backup] no folder picked", error);
		return null;
	}
	await writeInto(folder, backup);
	return folder.uri;
}

async function writeInto(folder: Directory, backup: BuiltBackup): Promise<void> {
	const existing = folder
		.list()
		.find((entry) => entry instanceof File && entry.name === backup.name);
	if (existing) existing.delete();
	const file = folder.createFile(backup.name, MIME);
	await file.write(backup.json);
}

/**
 * The daily automatic backup: when it's on and the last one is a day old, writes today's file
 * into the picked folder and keeps the newest seven. Quietly records a failure for the screen.
 */
export async function runAutoBackup(themePreference: string, now = new Date()): Promise<boolean> {
	if (Platform.OS === "web") return false;
	const auto = await loadAutoBackup();
	if (!auto.on || !auto.folder) return false;
	if (auto.lastAt && now.getTime() - new Date(auto.lastAt).getTime() < DAY_MS) return false;
	try {
		const backup = await buildBackup({ photos: auto.photos, themePreference, now });
		const folder = new Directory(auto.folder);
		await writeInto(folder, backup);
		const names = folder.list().map((entry) => entry.name);
		for (const old of backupsToPrune(names)) {
			const entry = folder.list().find((item) => item.name === old);
			entry?.delete();
		}
		await saveAutoBackup({ lastAt: now.toISOString(), lastError: null });
		return true;
	} catch (error) {
		console.error("[backup] automatic backup failed", error);
		await saveAutoBackup({
			lastError: "The last automatic backup couldn't be written. Pick the folder again.",
		});
		return false;
	}
}

/** Lets the person pick a backup file and reads it. Null when they cancel. */
export async function pickBackup(): Promise<
	{ ok: true; file: BackupFile } | { ok: false; reason: string } | null
> {
	const picked = await File.pickFileAsync({
		mimeTypes: Platform.OS === "ios" ? ["public.json"] : [MIME, "text/plain", "*/*"],
	});
	if (picked.canceled) return null;
	return parseBackup(await picked.result.text());
}

export type RestoreResult = { written: number; removed: number; photos: number; theme: string };

/** Puts a backup back on this phone. Everything it writes syncs to the account like any edit. */
export async function restoreBackup(file: BackupFile, mode: RestoreMode): Promise<RestoreResult> {
	const root = documentsRoot();

	let photos = 0;
	for (const [path, data] of Object.entries(file.photos ?? {})) {
		if (!safeRelativePath(path)) continue;
		const target = new File(Paths.document, path);
		const folder = target.parentDirectory;
		if (!folder.exists) folder.create({ intermediates: true });
		if (target.exists) target.delete();
		target.create();
		// oxlint-disable-next-line eslint/no-await-in-loop
		await target.write(data, { encoding: "base64" });
		photos += 1;
	}

	const records = rewriteRoot(file.records, file.photoRoot, root);
	const modules = rewriteRoot(file.modules, file.photoRoot, root);

	const store = await getRecordStore();
	const plan = planRestore(records, await store.all(), mode);
	await store.applyLocal(plan.puts, plan.removes);

	for (const name of EXPORT_DOCUMENTS) {
		const value = modules[name];
		// oxlint-disable-next-line eslint/no-await-in-loop
		if (value !== null && value !== undefined) await writeJson(name, value);
	}

	const answers = mergeStoredAnswers(file.answers);
	useOnboardingStore.setState(answers);
	await useOnboardingProgress.getState().persistAnswers();

	forgetPlans();
	rescheduleAll().catch((error: unknown) =>
		console.warn("[backup] could not plan reminders after the restore", error),
	);
	return {
		written: plan.puts.length,
		removed: plan.removes.length,
		photos,
		theme: file.preferences.theme,
	};
}
