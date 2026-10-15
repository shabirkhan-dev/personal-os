import { openExpoDriver } from "./expo-driver";
import { RecordStore } from "./record-store";

let opening: Promise<RecordStore> | null = null;

/** The app's record store, opened on first use and shared by every module. */
export function getRecordStore(): Promise<RecordStore> {
	if (!opening) {
		opening = openExpoDriver()
			.then((driver) => RecordStore.open(driver))
			.catch((error: unknown) => {
				opening = null;
				throw error;
			});
	}
	return opening;
}
