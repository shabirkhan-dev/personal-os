import type { AuthStatus } from "@/modules/auth/types/auth.types";
import type { MicPermission } from "@/modules/onboarding/hooks/use-mic-permission";
import type { HeightUnit, WeightUnit } from "@/modules/onboarding/lib/options";
import type { ThemePreference } from "@/theme/theme-provider";
import type { WeekStart } from "./profile-document";

/** "1 module on" / "4 modules on". */
export function modulesOnLabel(count: number): string {
	return `${count} ${count === 1 ? "module" : "modules"} on`;
}

export type UnitSystem = "metric" | "imperial";

/** The profile treats height and weight together: cm · kg or ft · lb. */
export function unitSystem(heightUnit: HeightUnit, weightUnit: WeightUnit): UnitSystem {
	return heightUnit === "ft" && weightUnit === "lb" ? "imperial" : "metric";
}

export function unitsFor(system: UnitSystem): { heightUnit: HeightUnit; weightUnit: WeightUnit } {
	return system === "imperial"
		? { heightUnit: "ft", weightUnit: "lb" }
		: { heightUnit: "cm", weightUnit: "kg" };
}

/** What the Units row shows, read from the saved units (mixed units are shown as they are). */
export function unitsLabel(heightUnit: HeightUnit, weightUnit: WeightUnit): string {
	return `${heightUnit} · ${weightUnit}`;
}

const THEME_LABEL: Record<ThemePreference, string> = {
	system: "System",
	light: "Light",
	dark: "Dark",
};

export function themeLabel(preference: ThemePreference): string {
	return THEME_LABEL[preference];
}

export function weekStartLabel(weekStart: WeekStart): string {
	return weekStart === "sunday" ? "Sunday" : "Monday";
}

/** The health platform this phone has: Apple Health on iOS, Health Connect on Android. */
export function healthName(os: string): string {
	return os === "ios" ? "Apple Health" : "Health Connect";
}

export type SyncState = { title: string; meta: string; canSignIn: boolean };

/** The Sync row from the account state; nothing claims a sync that did not happen. */
export function syncState(status: AuthStatus, email: string | null): SyncState {
	switch (status) {
		case "signed-in":
			return {
				title: "Sync",
				meta: email ? `Synced to your account · ${email}` : "Synced to your account",
				canSignIn: false,
			};
		case "offline":
			return { title: "Sync", meta: "Can't reach Personal OS", canSignIn: false };
		case "loading":
			return { title: "Sync", meta: "Checking your account…", canSignIn: false };
		default:
			return { title: "Sync", meta: "Only on this phone · Sign in to back up", canSignIn: true };
	}
}

export type MicAction = { meta: string; action: string | null };

/** Microphone row: what the permission is and the button that changes it, if any. */
export function micAction(state: MicPermission): MicAction {
	switch (state) {
		case "granted":
			return { meta: "Allowed · for talking to Personal OS", action: null };
		case "ask":
			return { meta: "Needed to talk to Personal OS", action: "Allow" };
		case "blocked":
			return { meta: "Blocked · turn it on in Settings", action: "Settings" };
		case "unavailable":
			return { meta: "Not available in this build", action: null };
		default:
			return { meta: "Checking…", action: null };
	}
}

/** Footer line, e.g. "Personal OS 1.0 · by RabtX". */
export function versionLabel(version: string | null | undefined): string {
	const trimmed = version?.trim();
	return trimmed ? `Personal OS ${trimmed} · by RabtX` : "Personal OS · by RabtX";
}
