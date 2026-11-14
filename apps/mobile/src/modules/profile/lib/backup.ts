import type { ExportFile } from "./export";

/**
 * A full backup: the export (answers, module documents, every record) plus the photos kept on the
 * phone, so it restores on a new phone exactly as it was. Photos already uploaded to the account
 * (https links) stay links.
 */
export type BackupFile = Omit<ExportFile, "format"> & {
	format: 2 | 3;
	/** Photo files under the app's documents folder, by path relative to it, as base64. */
	photos?: Record<string, string>;
	/** The documents folder the photo links in this file point into. */
	photoRoot?: string;
};

export type ParsedBackup = { ok: true; file: BackupFile } | { ok: false; reason: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a backup file; says plainly what's wrong when it isn't one. */
export function parseBackup(text: string): ParsedBackup {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, reason: "This file isn't a Personal OS backup (it isn't valid JSON)." };
	}
	if (!isObject(raw) || raw.app !== "Personal OS") {
		return { ok: false, reason: "This file isn't a Personal OS backup." };
	}
	if (raw.format !== 2 && raw.format !== 3) {
		return {
			ok: false,
			reason: "This backup was made by a newer version of the app. Update the app, then try again.",
		};
	}
	if (!isObject(raw.records) || !isObject(raw.modules) || !isObject(raw.answers)) {
		return { ok: false, reason: "This backup is incomplete or damaged." };
	}
	const records: Record<string, unknown[]> = {};
	for (const [name, list] of Object.entries(raw.records)) {
		if (/^[a-z][a-z0-9-]{0,63}$/.test(name) && Array.isArray(list)) records[name] = list;
	}
	const photos: Record<string, string> = {};
	if (isObject(raw.photos)) {
		for (const [path, data] of Object.entries(raw.photos)) {
			if (typeof data === "string" && safeRelativePath(path)) photos[path] = data;
		}
	}
	return {
		ok: true,
		file: {
			app: "Personal OS",
			format: raw.format,
			exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : "",
			appVersion: typeof raw.appVersion === "string" ? raw.appVersion : null,
			answers: raw.answers,
			preferences: isObject(raw.preferences)
				? { theme: String(raw.preferences.theme ?? "system") }
				: { theme: "system" },
			modules: raw.modules,
			records,
			photos,
			photoRoot: typeof raw.photoRoot === "string" ? raw.photoRoot : undefined,
		},
	};
}

/** A photo path inside the documents folder: no `..`, no absolute paths. */
export function safeRelativePath(path: string): boolean {
	return (
		path.length > 0 &&
		path.length < 300 &&
		!path.startsWith("/") &&
		!path.split("/").some((part) => part === ".." || part === "") &&
		/^[\w./-]+$/.test(path)
	);
}

/** Every link to a file under `root` anywhere in `value` (photos inside records and documents). */
export function localPhotoPaths(value: unknown, root: string): string[] {
	const found = new Set<string>();
	const walk = (node: unknown) => {
		if (typeof node === "string") {
			if (node.startsWith(root)) {
				const path = decodeURI(node.slice(root.length));
				if (safeRelativePath(path)) found.add(path);
			}
		} else if (Array.isArray(node)) {
			for (const item of node) walk(item);
		} else if (isObject(node)) {
			for (const item of Object.values(node)) walk(item);
		}
	};
	walk(value);
	return [...found].toSorted();
}

/** The same value with links into `from` pointing into `to` (another phone's documents folder). */
export function rewriteRoot<T>(value: T, from: string | undefined, to: string): T {
	if (!from || from === to) return value;
	const walk = (node: unknown): unknown => {
		if (typeof node === "string")
			return node.startsWith(from) ? to + node.slice(from.length) : node;
		if (Array.isArray(node)) return node.map(walk);
		if (isObject(node)) {
			return Object.fromEntries(Object.entries(node).map(([key, item]) => [key, walk(item)]));
		}
		return node;
	};
	return walk(value) as T;
}

export type RestoreMode = "merge" | "replace";

export type RestorePlan = {
	puts: { collection: string; id: string; data: unknown }[];
	removes: { collection: string; id: string }[];
};

const idOf = (item: unknown): string | null =>
	isObject(item) && typeof item.id === "string" && item.id ? item.id : null;

/**
 * What a restore writes. Merge adds and updates what's in the backup and keeps the rest; replace
 * also deletes what's on the phone but not in the backup (deletions sync like any change).
 */
export function planRestore(
	backup: Record<string, unknown[]>,
	current: Record<string, unknown[]>,
	mode: RestoreMode,
): RestorePlan {
	const puts: RestorePlan["puts"] = [];
	for (const [collection, items] of Object.entries(backup)) {
		for (const data of items) {
			const id = idOf(data);
			if (id) puts.push({ collection, id, data });
		}
	}
	const removes: RestorePlan["removes"] = [];
	if (mode === "replace") {
		const keep = new Set(puts.map((put) => `${put.collection}\u0000${put.id}`));
		for (const [collection, items] of Object.entries(current)) {
			for (const item of items) {
				const id = idOf(item);
				if (id && !keep.has(`${collection}\u0000${id}`)) removes.push({ collection, id });
			}
		}
	}
	return { puts, removes };
}

export type BackupSummary = {
	exportedAt: Date | null;
	records: number;
	photos: number;
	/** The biggest collections, for the preview ("food-meals: 120"). */
	largest: { name: string; count: number }[];
};

export function summarize(file: BackupFile): BackupSummary {
	const counts = Object.entries(file.records).map(([name, list]) => ({ name, count: list.length }));
	const exportedAt = file.exportedAt ? new Date(file.exportedAt) : null;
	return {
		exportedAt: exportedAt && !Number.isNaN(exportedAt.getTime()) ? exportedAt : null,
		records: counts.reduce((sum, item) => sum + item.count, 0),
		photos: Object.keys(file.photos ?? {}).length,
		largest: counts
			.filter((item) => item.count > 0)
			.toSorted((a, b) => b.count - a.count)
			.slice(0, 6),
	};
}

/** "food-meals" → "Food · meals" for the preview. */
export function collectionLabel(name: string): string {
	const [head = name, ...rest] = name.split("-");
	const area = head.charAt(0).toUpperCase() + head.slice(1);
	return rest.length ? `${area} · ${rest.join(" ")}` : area;
}

/** Backups kept in an automatic-backup folder before the oldest are removed. */
export const KEEP_BACKUPS = 7;

/** The automatic backups to delete: everything past the newest `keep`. */
export function backupsToPrune(names: readonly string[], keep = KEEP_BACKUPS): string[] {
	return names
		.filter((name) => /^personal-os-backup-\d{4}-\d{2}-\d{2}(-\d+)?\.json$/.test(name))
		.toSorted()
		.toReversed()
		.slice(keep);
}
