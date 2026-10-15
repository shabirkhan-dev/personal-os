import { useEffect, useState } from "react";

/** Re-renders every `intervalMs` so "today", "due" and "in 2h 10m" stay right. */
export function useNow(intervalMs = 60_000): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), intervalMs);
		return () => clearInterval(timer);
	}, [intervalMs]);
	return now;
}
