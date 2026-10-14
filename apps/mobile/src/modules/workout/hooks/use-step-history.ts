import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { lastDays } from "../lib/steps";

export type StepDay = { date: Date; steps: number };

export type StepHistory =
	| { status: "loading" }
	| { status: "ready"; days: StepDay[] }
	| { status: "denied" }
	| { status: "unavailable" }
	/** Android only gives live counts; history needs Health Connect. */
	| { status: "android" }
	| { status: "error" };

/** iOS keeps seven days of pedometer history. */
const DAYS = 7;

async function readHistory(): Promise<StepHistory> {
	if (Platform.OS === "android") return { status: "android" };
	if (Platform.OS !== "ios") return { status: "unavailable" };
	const available = await Pedometer.isAvailableAsync();
	if (!available) return { status: "unavailable" };
	const permission = await Pedometer.requestPermissionsAsync();
	if (!permission.granted) return { status: "denied" };
	const now = new Date();
	const starts = lastDays(now, DAYS);
	const days = await Promise.all(
		starts.map(async (start, index) => {
			const end = starts[index + 1] ?? now;
			const result = await Pedometer.getStepCountAsync(start, end);
			return { date: start, steps: result.steps };
		}),
	);
	return { status: "ready", days };
}

/** Steps for the last seven days from the iPhone's motion data; refreshes when the app returns. */
export function useStepHistory(): { history: StepHistory; reload: () => void } {
	const [history, setHistory] = useState<StepHistory>({ status: "loading" });

	const reload = useCallback(() => {
		readHistory()
			.then(setHistory)
			.catch((error: unknown) => {
				console.error("Could not read step history", error);
				setHistory({ status: "error" });
			});
	}, []);

	useEffect(() => {
		reload();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") reload();
		});
		return () => subscription.remove();
	}, [reload]);

	return { history, reload };
}
