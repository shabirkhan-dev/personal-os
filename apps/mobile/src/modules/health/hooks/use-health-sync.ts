import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { healthStore, type StoreStatus } from "../services/health-store";
import { syncHealthStore } from "../services/health-sync";
import { useHealthSyncSettings } from "./health-sync-store";

/** Syncs run at most this often on their own; Sync now always runs. */
const EVERY_MS = 15 * 60_000;

/**
 * The phone's health store from a screen: whether it's there, connecting to it, and a sync when
 * Health opens or the app comes back, if it's been a while.
 */
export function useHealthSync() {
	const { data, hydrate, update } = useHealthSyncSettings();
	const [status, setStatus] = useState<StoreStatus | null>(healthStore ? null : "unsupported");
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const running = useRef(false);

	useEffect(() => {
		void hydrate();
		healthStore
			?.status()
			.then(setStatus)
			.catch((caught: unknown) => {
				console.warn("[health] could not check the health store", caught);
				setStatus("unsupported");
			});
	}, [hydrate]);

	const sync = useCallback(async () => {
		if (running.current) return;
		running.current = true;
		setSyncing(true);
		setError(null);
		try {
			await syncHealthStore();
			update((doc) => ({ ...doc, lastSyncAt: new Date().toISOString() }));
		} catch (caught) {
			console.warn("[health] sync from the health store failed", caught);
			setError("Couldn't read from it this time. Try Sync now.");
		} finally {
			running.current = false;
			setSyncing(false);
		}
	}, [update]);

	const enabled = data.enabled && status === "ready";
	useEffect(() => {
		if (!enabled) return;
		const due = () => !data.lastSyncAt || Date.now() - Date.parse(data.lastSyncAt) > EVERY_MS;
		if (due()) void sync();
		const subscription = AppState.addEventListener("change", (next) => {
			if (next === "active" && due()) void sync();
		});
		return () => subscription.remove();
	}, [enabled, data.lastSyncAt, sync]);

	const connect = useCallback(async () => {
		if (!healthStore) return;
		setError(null);
		try {
			const allowed = await healthStore.connect();
			if (!allowed) {
				setError(`Nothing was allowed. You can change that in ${healthStore.name}.`);
				return;
			}
			update((doc) => ({ ...doc, enabled: true }));
			await sync();
		} catch (caught) {
			console.warn("[health] could not connect to the health store", caught);
			setError(`Couldn't open ${healthStore.name}.`);
		}
	}, [sync, update]);

	const disconnect = useCallback(() => update((doc) => ({ ...doc, enabled: false })), [update]);

	return {
		store: healthStore,
		status,
		enabled,
		lastSyncAt: data.lastSyncAt,
		syncing,
		error,
		connect,
		disconnect,
		sync,
	};
}
