import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { Platform } from "react-native";
import { create } from "zustand";
import * as SecureStore from "@/lib/secure-store";

/**
 * App lock: fingerprint, face or the phone's passcode before the app shows anything, when it
 * opens and when it comes back after `after` seconds away. Privacy mode hides the app's content
 * in the recent-apps screen and blocks screenshots (Android), and covers it while switching apps.
 */

export type LockSettings = {
	enabled: boolean;
	/** Seconds away before it locks again: 0 is every time. */
	after: number;
	privacy: boolean;
};

export const LOCK_AFTER_CHOICES = [0, 60, 300, 900] as const;

const KEY = "personal-os.app-lock";
const DEFAULTS: LockSettings = { enabled: false, after: 60, privacy: false };

type LockState = {
	hydrated: boolean;
	settings: LockSettings;
	locked: boolean;
	/** True while the unlock prompt is up: its passcode screen sends the app to the background. */
	authenticating: boolean;
	/** When the app went to the background (ms), to know whether to lock on return. */
	leftAt: number | null;
	hydrate: () => Promise<void>;
	update: (change: Partial<LockSettings>) => Promise<void>;
	left: () => void;
	returned: () => void;
	unlock: () => Promise<boolean>;
};

async function applyPrivacy(on: boolean): Promise<void> {
	if (Platform.OS === "web") return;
	try {
		if (on) await ScreenCapture.preventScreenCaptureAsync("privacy");
		else await ScreenCapture.allowScreenCaptureAsync("privacy");
	} catch (error) {
		console.warn("[lock] could not change screenshot protection", error);
	}
}

export const useAppLock = create<LockState>((set, get) => ({
	hydrated: false,
	settings: DEFAULTS,
	locked: false,
	authenticating: false,
	leftAt: null,

	hydrate: async () => {
		let settings = DEFAULTS;
		try {
			const raw = await SecureStore.getItemAsync(KEY);
			if (raw) settings = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LockSettings>) };
		} catch (error) {
			console.warn("[lock] could not read the lock settings", error);
		}
		await applyPrivacy(settings.privacy);
		// A fresh start is "away for a long time": locked when the lock is on.
		set({ hydrated: true, settings, locked: settings.enabled && Platform.OS !== "web" });
	},

	update: async (change) => {
		const settings = { ...get().settings, ...change };
		await SecureStore.setItemAsync(KEY, JSON.stringify(settings));
		if (change.privacy !== undefined) await applyPrivacy(settings.privacy);
		set({ settings });
	},

	left: () => {
		if (get().authenticating) return;
		if (get().leftAt === null) set({ leftAt: Date.now() });
	},

	returned: () => {
		const { settings, leftAt, locked } = get();
		const away = leftAt === null ? 0 : (Date.now() - leftAt) / 1000;
		set({
			leftAt: null,
			locked: locked || (settings.enabled && leftAt !== null && away >= settings.after),
		});
	},

	unlock: async () => {
		set({ authenticating: true });
		try {
			const result = await authenticate("Unlock Personal OS");
			if (result) set({ locked: false, leftAt: null });
			return result;
		} finally {
			set({ authenticating: false });
		}
	},
}));

export type LockSupport = { available: boolean; reason: string | null };

/** Whether this phone can lock the app: a fingerprint, face or at least a passcode. */
export async function lockSupport(): Promise<LockSupport> {
	if (Platform.OS === "web")
		return { available: false, reason: "App lock works on the phone app." };
	const level = await LocalAuthentication.getEnrolledLevelAsync();
	if (level === LocalAuthentication.SecurityLevel.NONE) {
		return {
			available: false,
			reason: "Set a screen lock (PIN, pattern, fingerprint or face) on your phone first.",
		};
	}
	return { available: true, reason: null };
}

/** Asks for the fingerprint, face or passcode. */
export async function authenticate(promptMessage: string): Promise<boolean> {
	if (Platform.OS === "web") return true;
	const result = await LocalAuthentication.authenticateAsync({
		promptMessage,
		cancelLabel: "Cancel",
		disableDeviceFallback: false,
	});
	return result.success;
}
