import { useEffect, useState } from "react";
import { AppState } from "react-native";

const TICK_MS = 60_000;

/** The current time, refreshed every minute and when the app comes back, so "today" rolls over. */
export function useNow(): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), TICK_MS);
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") setNow(new Date());
		});
		return () => {
			clearInterval(timer);
			subscription.remove();
		};
	}, []);
	return now;
}
