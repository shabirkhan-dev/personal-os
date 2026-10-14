import { isRecord, oneOf } from "@/lib/storage/parse";

export type WeekStart = "monday" | "sunday";

/** Preferences that live only on the Profile screen. */
export type ProfileDocument = { weekStart: WeekStart };

export const initialProfile: ProfileDocument = { weekStart: "monday" };

export function parseProfile(raw: unknown): ProfileDocument {
	if (!isRecord(raw)) return { ...initialProfile };
	return { weekStart: oneOf(raw.weekStart, ["monday", "sunday"] as const, "monday") };
}
