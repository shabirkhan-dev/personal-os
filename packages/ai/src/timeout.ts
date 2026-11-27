/**
 * A signal that aborts after `ms`. React Native has no `AbortSignal.timeout`, so this falls back
 * to a controller and a timer there.
 */
export function timeoutSignal(ms: number): AbortSignal {
	if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
	const controller = new AbortController();
	setTimeout(() => controller.abort(new Error("timeout")), ms);
	return controller.signal;
}
