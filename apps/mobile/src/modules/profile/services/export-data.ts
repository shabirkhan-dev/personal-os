import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import { Platform, Share } from "react-native";
import { getRecordStore } from "@/lib/db/database";
import { readJson } from "@/lib/storage/json-file";
import { pickAnswers } from "@/modules/onboarding/store/answers-storage";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import {
	buildExport,
	EXPORT_DOCUMENTS,
	exportFileName,
	exportJson,
	savedDocumentCount,
} from "../lib/export";

async function readDocument(name: string): Promise<[string, unknown]> {
	try {
		return [name, await readJson(name)];
	} catch (error) {
		console.error(`Could not read ${name} for the export`, error);
		return [name, null];
	}
}

async function readDocuments(): Promise<Record<string, unknown>> {
	const entries = await Promise.all(EXPORT_DOCUMENTS.map(readDocument));
	return Object.fromEntries(entries);
}

/** Writes the JSON to the cache folder; returns its uri, or `null` when the file could not be written. */
async function writeExportFile(name: string, json: string): Promise<string | null> {
	try {
		const file = new File(Paths.cache, name);
		if (file.exists) file.delete();
		file.create({ intermediates: true });
		await file.write(json);
		return file.uri;
	} catch (error) {
		console.error("Could not write the export file; sharing it as text", error);
		return null;
	}
}

export type ExportResult = { shared: boolean; documents: number };

/**
 * Builds one JSON file with the onboarding answers and every module document and opens the share
 * sheet. iOS shares the file; Android shares the JSON text (its share sheet takes no file urls).
 */
export async function exportData(themePreference: string): Promise<ExportResult> {
	const now = new Date();
	const documents = await readDocuments();
	const records = await (await getRecordStore()).all();
	const file = buildExport({
		exportedAt: now,
		appVersion: Constants.expoConfig?.version ?? null,
		answers: pickAnswers(useOnboardingStore.getState()),
		documents,
		records,
		themePreference,
	});
	const json = exportJson(file);
	const name = exportFileName(now);
	const uri = Platform.OS === "ios" ? await writeExportFile(name, json) : null;
	const result = await Share.share(
		uri ? { url: uri, title: name } : { message: json, title: name },
		{ subject: name, dialogTitle: "Export your data" },
	);
	return {
		shared: result.action === Share.sharedAction,
		documents: savedDocumentCount(documents, records),
	};
}
