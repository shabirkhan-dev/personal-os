import { useEffect, useState } from "react";

/** The current time, refreshed every minute so labels and the AM/PM split stay right. */
export function useNow(everyMs = 60_000): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), everyMs);
		return () => clearInterval(timer);
	}, [everyMs]);
	return now;
}
