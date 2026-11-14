import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useCollection } from "@/lib/db/collection";
import { faithSettings, tasbihDays } from "@/modules/faith/data/collections";
import { financeEntries, financeSettings } from "@/modules/finance/data/collections";
import { foodSettings, water } from "@/modules/food/data/collections";
import { refreshWidgets } from "../services/widget-task";

const SETTLE_MS = 1500;

/** Keeps the home-screen widgets in step with the app: after changes, and when it goes to the back. */
export function useWidgetRefresh(): void {
	const sources = [
		useCollection(water).data,
		useCollection(foodSettings).data,
		useCollection(tasbihDays).data,
		useCollection(faithSettings).data,
		useCollection(financeEntries).data,
		useCollection(financeSettings).data,
	];
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (Platform.OS !== "android") return;
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			refreshWidgets().catch((error: unknown) =>
				console.warn("[widgets] could not refresh", error),
			);
		}, SETTLE_MS);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
		// oxlint-disable-next-line react/exhaustive-deps -- refresh when any source changes
	}, sources);

	useEffect(() => {
		if (Platform.OS !== "android") return;
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "background") {
				refreshWidgets().catch((error: unknown) =>
					console.warn("[widgets] could not refresh", error),
				);
			}
		});
		return () => subscription.remove();
	}, []);
}
