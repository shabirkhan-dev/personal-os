import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";
import { bridgeStoreToQueries } from "@/lib/db/collection";
import { getRecordStore } from "@/lib/db/database";
import { useAuth } from "@/modules/auth";
import { claimStore, createSyncEngine, type SyncEngine, type SyncState } from "./sync-engine";
import { apiTransport } from "./sync-transport";

/** Local writes are batched for a moment before they are pushed. */
const PUSH_DELAY_MS = 3_000;
const PERIODIC_MS = 5 * 60_000;

type SyncContextValue = SyncState & {
	/** Pushes and pulls now; resolves when done (rejects offline). */
	syncNow: () => Promise<void>;
};

const idle: SyncState = { status: "idle", lastSyncedAt: null, error: null };
const SyncContext = createContext<SyncContextValue>({ ...idle, syncNow: async () => undefined });

/**
 * Keeps the on-device record store in step with the API: after sign-in, when the app comes
 * back to the foreground, a few seconds after local changes, and every few minutes.
 * Offline it does nothing harmful; changes wait and go out on the next successful sync.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const { status, token, user } = useAuth();
	const tokenRef = useRef(token);
	useEffect(() => {
		tokenRef.current = token;
	}, [token]);
	const [engine, setEngine] = useState<SyncEngine | null>(null);
	const [state, setState] = useState<SyncState>(idle);
	const userId = status === "signed-in" ? (user?.id ?? null) : null;
	const [claimedBy, setClaimedBy] = useState<string | null>(null);

	useEffect(() => {
		let unbridge: (() => void) | undefined;
		let cancelled = false;
		getRecordStore()
			.then((store) => {
				if (cancelled) return;
				unbridge = bridgeStoreToQueries(store, queryClient);
				setEngine(createSyncEngine({ store, transport: apiTransport(() => tokenRef.current) }));
			})
			.catch((error: unknown) => console.error("[sync] could not open the local database", error));
		return () => {
			cancelled = true;
			unbridge?.();
		};
	}, [queryClient]);

	useEffect(() => engine?.subscribe(setState), [engine]);

	const ready = engine !== null && userId !== null && claimedBy === userId;

	const syncNow = useCallback(async () => {
		if (!engine || !ready) throw new Error("Sign in to sync");
		await engine.sync();
	}, [engine, ready]);

	const syncQuietly = useCallback(() => {
		if (!engine || !ready) return;
		engine.sync().catch((error: unknown) => console.warn("[sync] will retry later", error));
	}, [engine, ready]);

	// The signed-in account claims the local records before anything is pushed.
	useEffect(() => {
		if (!engine || !userId) return;
		let cancelled = false;
		getRecordStore()
			.then((store) => claimStore(store, userId))
			.then(() => {
				if (!cancelled) setClaimedBy(userId);
			})
			.catch((error: unknown) => console.error("[sync] could not prepare local records", error));
		return () => {
			cancelled = true;
		};
	}, [engine, userId]);

	useEffect(() => {
		if (!ready) return;
		syncQuietly();
		const appState = AppState.addEventListener("change", (next) => {
			if (next === "active") syncQuietly();
		});
		const timer = setInterval(syncQuietly, PERIODIC_MS);
		return () => {
			appState.remove();
			clearInterval(timer);
		};
	}, [ready, syncQuietly]);

	useEffect(() => {
		if (!ready) return;
		let pending: ReturnType<typeof setTimeout> | null = null;
		let unsubscribe: (() => void) | undefined;
		getRecordStore()
			.then((store) => {
				unsubscribe = store.subscribe(() => {
					if (pending) clearTimeout(pending);
					pending = setTimeout(syncQuietly, PUSH_DELAY_MS);
				});
			})
			.catch((error: unknown) => console.error("[sync] could not watch local changes", error));
		return () => {
			if (pending) clearTimeout(pending);
			unsubscribe?.();
		};
	}, [ready, syncQuietly]);

	const value = useMemo(() => ({ ...state, syncNow }), [state, syncNow]);
	return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
	return useContext(SyncContext);
}
