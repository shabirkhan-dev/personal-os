// Dot timer: a React Native port of "Dot timer" by Bruno Delorence
// (https://brunodelorence.com/components/dot-timer). MIT License, Copyright (c) 2026 Bruno
// Delorence. Adapted for Personal OS: Reanimated instead of CSS animations, Kit v2 tokens for its
// colours, and a controlled time so it can show a countdown as well as a count up.

import { useEffect, useRef } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { PoText } from "@/components/ui/po-text";
import { dotTime, spokenTime } from "@/lib/dot-time";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

/*
 * A dark pill: on its left a round lamp of 21 LEDs (a 5 by 5 grid without its corners) rolls a
 * leaning band of light across itself while the timer runs; on its right the time, m:ss (h:mm:ss
 * past an hour), in fixed-width figures so the pill never shifts.
 *
 * - Every LED runs the same 36-frame cycle (1.2 s): lit for 16 frames, warm for 3 either side,
 *   dim the rest. Only where it starts differs (ONSET), which makes the band lean and roll.
 * - One shared frame counter drives all 21 LEDs on the UI thread; pausing holds the frame and
 *   dims the lamp. Reduced motion: the LEDs hold a half-lit frame and nothing animates.
 * - Press to start or pause; hold 600 ms to reset (the pill presses in as it goes). Screen readers
 *   get the same as actions, the time in words in its name, and an announcement on each change.
 * - The time is the caller's: pass `ms` (counting up or down) and `running`.
 */

export type DotTimerColor = "red" | "amber" | "green" | "blue" | "white";
export type DotTimerSize = "sm" | "md" | "lg";

const FRAMES = 36;
const ONSET: (number | null)[][] = [
	[null, 10, 15, 20, null],
	[3, 8, 13, 19, 24],
	[1, 7, 12, 17, 22],
	[0, 5, 10, 15, 20],
	[null, 3, 8, 13, null],
];
/** The frame a still lamp holds under reduced motion: its left half lit. */
const HELD = 13;
const HOLD_MS = 600;
const DIM = 0.275;
const WARM = 0.395;
/** A px of the pill at each size; the pill is 63 of them tall. */
const UNIT: Record<DotTimerSize, number> = { sm: 0.72, md: 1, lg: 1.45 };

const LEDS = ONSET.flatMap((row, y) =>
	row.flatMap((onset, x) => (onset === null ? [] : [{ x, y, onset }])),
);

const LED_TOKENS = {
	red: "ledRed",
	amber: "ledAmber",
	green: "ledGreen",
	blue: "ledBlue",
	white: "ledWhite",
} as const;

function Led({
	x,
	y,
	onset,
	frame,
	color,
	u,
}: {
	x: number;
	y: number;
	onset: number;
	frame: SharedValue<number>;
	color: string;
	u: number;
}) {
	const style = useAnimatedStyle(() => {
		const progress = (((Math.floor(frame.value) - onset) % FRAMES) + FRAMES) % FRAMES;
		const opacity = progress < 16 ? 1 : progress < 19 || progress >= 33 ? WARM : DIM;
		return { opacity };
	});
	return (
		<Animated.View
			style={[
				styles.led,
				{
					left: x * 7.82 * u,
					top: y * 7.82 * u,
					width: 5.4 * u,
					height: 5.4 * u,
					borderRadius: 2.7 * u,
					backgroundColor: color,
				},
				style,
			]}
		/>
	);
}

export type DotTimerProps = {
	/** The time shown, in ms: counting up or down, as the caller keeps it. */
	ms: number;
	running: boolean;
	/** Press: start or pause. Without it the pill only shows the time. */
	onToggle?: () => void;
	/** Hold 600 ms: back to the start. */
	onReset?: () => void;
	/** What is timed, for screen readers: "Rest timer", "Round 2". The time follows it. */
	label: string;
	color?: DotTimerColor;
	size?: DotTimerSize;
	disabled?: boolean;
};

export function DotTimer({
	ms,
	running,
	onToggle,
	onReset,
	label,
	color = "red",
	size = "md",
	disabled = false,
}: DotTimerProps) {
	const { colors } = usePoTheme();
	const reduced = useReducedMotion();
	const frame = useSharedValue(reduced ? HELD : 0);
	const press = useSharedValue(1);
	const held = useRef(false);
	const u = UNIT[size];
	const animate = running && !reduced;

	useEffect(() => {
		if (reduced) {
			cancelAnimation(frame);
			frame.value = HELD;
			return;
		}
		if (!animate) {
			cancelAnimation(frame);
			return;
		}
		const from = frame.value % FRAMES;
		frame.value = from;
		frame.value = withRepeat(
			withTiming(from + FRAMES, {
				duration: 1200,
				easing: Easing.linear,
			}),
			-1,
			false,
		);
		return () => cancelAnimation(frame);
	}, [animate, reduced, frame]);

	const lamp = useAnimatedStyle(() => ({ opacity: running ? 1 : 0.62 }), [running]);
	const pill = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

	const time = dotTime(ms);
	const led = colors[LED_TOKENS[color]];
	const fontSize = 25.5 * u;
	const interactive = Boolean(onToggle || onReset) && !disabled;

	const toggle = () => {
		if (!onToggle || disabled) return;
		haptics.tap();
		onToggle();
		AccessibilityInfo.announceForAccessibility(
			`${running ? "Paused" : "Started"} at ${spokenTime(ms)}`,
		);
	};
	const reset = () => {
		if (!onReset || disabled) return;
		haptics.success();
		cancelAnimation(frame);
		frame.value = reduced ? HELD : 0;
		onReset();
		AccessibilityInfo.announceForAccessibility(`${label} reset`);
	};

	return (
		<Pressable
			accessibilityRole={onToggle ? "togglebutton" : "timer"}
			accessibilityLabel={`${label}, ${spokenTime(ms)}`}
			accessibilityState={{ checked: onToggle ? running : undefined, disabled }}
			accessibilityHint={
				onToggle && onReset
					? "Press to start or pause. Hold to reset."
					: onToggle
						? "Press to start or pause."
						: undefined
			}
			accessibilityActions={[
				...(onToggle ? [{ name: "activate" as const }] : []),
				...(onReset ? [{ name: "reset", label: "Reset" }] : []),
			]}
			onAccessibilityAction={(event) => {
				if (event.nativeEvent.actionName === "activate") toggle();
				if (event.nativeEvent.actionName === "reset") reset();
			}}
			disabled={!interactive}
			delayLongPress={HOLD_MS}
			onPressIn={() => {
				held.current = false;
				if (interactive)
					press.value = withTiming(onReset ? 0.96 : 0.985, { duration: onReset ? HOLD_MS : 120 });
			}}
			onPressOut={() => {
				press.value = withTiming(1, { duration: 160 });
			}}
			onLongPress={() => {
				if (!onReset) return;
				held.current = true;
				reset();
			}}
			onPress={() => {
				if (held.current) {
					held.current = false;
					return;
				}
				toggle();
			}}
			style={styles.press}
		>
			<Animated.View
				style={[
					styles.pill,
					{
						height: 63 * u,
						gap: 16.7 * u,
						paddingLeft: 14 * u,
						paddingRight: 17.8 * u,
						borderWidth: Math.max(1, u),
						borderColor: colors.timerEdge,
						backgroundColor: colors.timerPill,
						opacity: disabled ? 0.5 : 1,
					},
					pill,
				]}
			>
				<Animated.View
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					style={[{ width: (4 * 7.82 + 5.4) * u, height: (4 * 7.82 + 5.4) * u }, lamp]}
				>
					{LEDS.map((item) => (
						<Led key={`${item.x}-${item.y}`} {...item} frame={frame} color={led} u={u} />
					))}
				</Animated.View>
				<View
					style={styles.time}
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
				>
					{[...time].map((char, index) => (
						<View
							// oxlint-disable-next-line react/no-array-index-key -- a fixed slot per figure
							key={index}
							style={{ width: (char === ":" ? 0.313 : 0.64) * fontSize, alignItems: "center" }}
						>
							<PoText
								variant="row15"
								style={[
									styles.digit,
									{ fontSize, lineHeight: fontSize * 1.15, color: colors.timerInk },
								]}
							>
								{char}
							</PoText>
						</View>
					))}
				</View>
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	press: { alignSelf: "center" },
	pill: { flexDirection: "row", alignItems: "center", borderRadius: 999 },
	led: { position: "absolute" },
	time: { flexDirection: "row", alignItems: "center" },
	digit: { fontVariant: ["tabular-nums"], fontWeight: "500", includeFontPadding: false },
});
