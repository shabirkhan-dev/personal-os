import { createDocumentStore } from "@/lib/storage/document-store";
import { initialProfile, parseProfile } from "../lib/profile-document";

/** Profile-only preferences (week start), saved as profile.json on the phone. */
export const useProfileStore = createDocumentStore("profile", initialProfile, parseProfile);
