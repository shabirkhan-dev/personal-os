/** Stored documents included in the export, by file name. */
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
	themePreference: string;
};

export type ExportFile = {
	app: "Personal OS";
	format: 1;
	exportedAt: string;
	appVersion: string | null;
	answers: Record<string, unknown>;
	preferences: { theme: string };
	modules: Record<string, unknown>;
};

/** One JSON document with everything the person saved on this phone. */
export function buildExport(input: ExportInput): ExportFile {
	const modules: Record<string, unknown> = {};
	for (const name of Object.keys(input.documents).sort()) {
		modules[name] = input.documents[name] ?? null;
	}
	return {
		app: "Personal OS",
		format: 1,
		exportedAt: input.exportedAt.toISOString(),
		appVersion: input.appVersion,
		answers: input.answers,
		preferences: { theme: input.themePreference },
		modules,
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

/** How many module documents have anything saved. */
export function savedDocumentCount(documents: Record<string, unknown>): number {
	return Object.values(documents).filter((value) => value !== null && value !== undefined).length;
}
