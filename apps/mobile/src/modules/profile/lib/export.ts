/**
 * JSON documents still kept as files (the rest of the modules live in the record store). Old
 * module files are read too, for phones that never opened a module since its move.
 */
export const EXPORT_DOCUMENTS = [
	"finance",
	"workout",
	"skincare",
	"food",
	"home-view",
	"profile",
] as const;

export type ExportInput = {
	exportedAt: Date;
	appVersion: string | null;
	/** The onboarding answers (name, body, rhythm, goals, modules…). */
	answers: Record<string, unknown>;
	/** Each module document as stored; `null` when the module has nothing saved yet. */
	documents: Record<string, unknown>;
	/** Every record in the on-device database, by collection (`finance-entries`, …). */
	records: Record<string, unknown[]>;
	themePreference: string;
};

export type ExportFile = {
	app: "Personal OS";
	format: 2;
	exportedAt: string;
	appVersion: string | null;
	answers: Record<string, unknown>;
	preferences: { theme: string };
	modules: Record<string, unknown>;
	records: Record<string, unknown[]>;
};

/** One JSON document with everything the person saved on this phone. */
export function buildExport(input: ExportInput): ExportFile {
	const modules: Record<string, unknown> = {};
	for (const name of Object.keys(input.documents).sort()) {
		modules[name] = input.documents[name] ?? null;
	}
	return {
		app: "Personal OS",
		format: 2,
		exportedAt: input.exportedAt.toISOString(),
		appVersion: input.appVersion,
		answers: input.answers,
		preferences: { theme: input.themePreference },
		modules,
		records: Object.fromEntries(
			Object.keys(input.records)
				.sort()
				.map((name) => [name, input.records[name] ?? []]),
		),
	};
}

export function exportJson(file: ExportFile): string {
	return JSON.stringify(file, null, 2);
}

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

/** e.g. "personal-os-2026-10-14.json" (local date). */
export function exportFileName(date: Date): string {
	return `personal-os-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** How many documents and records the export carries. */
export function savedDocumentCount(
	documents: Record<string, unknown>,
	records: Record<string, unknown[]> = {},
): number {
	const files = Object.values(documents).filter((value) => value !== null && value !== undefined);
	return files.length + Object.values(records).reduce((sum, list) => sum + list.length, 0);
}
