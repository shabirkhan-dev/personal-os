import type { Reading } from "../lib/health-model";

/**
 * The phone's health store: Health Connect on Android (`health-store.android.ts`) and Apple
 * Health on iPhone (`health-store.ios.ts`). Elsewhere (the web preview) there is none.
 */
export type StoreStatus = "ready" | "needs-app" | "unsupported";

/**
 * What one read found. `allowed` is how many data types the person let Health read; `failed`
 * names the ones that errored, so one broken type doesn't hide the rest.
 */
export type StoreRead = { readings: Reading[]; allowed: number; failed: string[] };

export type HealthStore = {
	/** "Health Connect" or "Apple Health", for the screens. */
	name: string;
	status: () => Promise<StoreStatus>;
	/** Asks for read access; true when at least one data type was allowed. */
	connect: () => Promise<boolean>;
	/** Everything Health keeps, measured between the two times. */
	read: (from: Date, to: Date) => Promise<StoreRead>;
	/** Opens the store's own settings, where access is changed or the app is installed. */
	openSettings: () => void;
};

export const healthStore: HealthStore | null = null;
