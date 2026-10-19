import { Directory, File, Paths } from "expo-file-system";
import { getRecordStore } from "@/lib/db/database";
import { useMemberStore } from "@/modules/onboarding/store/member-store";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";

/** Folders of photos the modules keep under the documents directory. */
const PHOTO_FOLDERS = new Set(["avatar", "receipts", "meal-photos", "fashion-photos", "wishlist"]);

/**
 * Removes everything Personal OS keeps on this phone: every module record, the documents and
 * photos, the member card and the setup answers. Setup starts again afterwards. Used after the
 * account is deleted, or when someone signs out and wants nothing left behind.
 */
export async function eraseThisPhone(): Promise<void> {
	await (await getRecordStore()).clear();
	const documents = new Directory(Paths.document);
	for (const entry of documents.exists ? documents.list() : []) {
		const photos = entry instanceof Directory && PHOTO_FOLDERS.has(entry.name);
		const json = entry instanceof File && entry.name.endsWith(".json");
		if (photos || json) entry.delete();
	}
	await useMemberStore.getState().clear();
	await useOnboardingProgress.getState().restart();
}
