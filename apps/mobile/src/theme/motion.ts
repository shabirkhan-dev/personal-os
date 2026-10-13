import { Easing, ReduceMotion, withDelay, withTiming } from "react-native-reanimated";

/**
 * Calm entrance motion for the whole app. Elements fade in with a short 8px rise, or settle from
 * 96% scale instead of zooming from zero. Staggers are compressed and capped so a list never
 * takes long to arrive, and the system "reduce motion" setting skips the movement.
 */

const RISE_DISTANCE = 8;
const POP_FROM = 0.96;
const DURATION = 280;
const MAX_DELAY = 240;
const easing = Easing.out(Easing.cubic);

/** Halves the old hand-tuned delays and caps them. */
function settle(delay: number): number {
	return Math.min(Math.max(0, delay) * 0.5, MAX_DELAY);
}

function timing(toValue: number, delay: number) {
	"worklet";
	return withDelay(
		delay,
		withTiming(toValue, { duration: DURATION, easing, reduceMotion: ReduceMotion.System }),
	);
}

/** Fade in with a short rise. `delay` is in ms (compressed and capped). */
export function rise(delay = 0) {
	const wait = settle(delay);
	return () => {
		"worklet";
		return {
			initialValues: { opacity: 0, transform: [{ translateY: RISE_DISTANCE }] },
			animations: {
				opacity: timing(1, wait),
				transform: [{ translateY: timing(0, wait) }],
			},
		};
	};
}

/** Fade in while settling from 96% scale; replaces zooming from zero. */
export function pop(delay = 0) {
	const wait = settle(delay);
	return () => {
		"worklet";
		return {
			initialValues: { opacity: 0, transform: [{ scale: POP_FROM }] },
			animations: {
				opacity: timing(1, wait),
				transform: [{ scale: timing(1, wait) }],
			},
		};
	};
}
