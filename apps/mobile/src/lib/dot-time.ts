/** How the Dot timer writes and says a time. */

/** m:ss, or h:mm:ss from an hour on. */
export function dotTime(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const ss = String(total % 60).padStart(2, "0");
	return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** The time in words for screen readers: "1 minute 5 seconds". */
export function spokenTime(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const parts: [number, string][] = [
		[Math.floor(total / 3600), "hour"],
		[Math.floor((total % 3600) / 60), "minute"],
		[total % 60, "second"],
	];
	const words = parts.filter(([n]) => n).map(([n, unit]) => `${n} ${unit}${n === 1 ? "" : "s"}`);
	return words.length ? words.join(" ") : "0 seconds";
}
