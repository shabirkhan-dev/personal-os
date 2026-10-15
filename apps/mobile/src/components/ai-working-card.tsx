import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import type { AiJob } from "@/lib/ai-jobs/ai-jobs-store";
import { usePoTheme } from "@/theme";

export type AiWorkingCardProps = {
	job: AiJob;
	/** What the AI is doing, shown one after another while it works. */
	steps: readonly string[];
	onRetry: () => void;
	onDismiss: () => void;
};

const STEP_MS = 3500;
const LINE_WIDTHS = ["92%", "76%", "84%"] as const;

/**
 * Stands in for content the AI is still writing: a breathing sparkle, placeholder lines and what
 * it is doing right now. The work keeps going if the person leaves the screen.
 */
export function AiWorkingCard({ job, steps, onRetry, onDismiss }: AiWorkingCardProps) {
	const { colors } = usePoTheme();
	const failed = job.status === "failed";
	const seconds = useElapsed(job.startedAt, !failed);
	const step =
		steps.length > 0
			? steps[Math.min(Math.floor((seconds * 1000) / STEP_MS), steps.length - 1)]
			: "";

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
			accessibilityRole="progressbar"
			accessibilityLabel={failed ? `${job.label} failed` : `${job.label}. ${step}`}
		>
			<View style={styles.head}>
				<Spark failed={failed} />
				<View style={styles.flex}>
					<PoText variant="title18">{job.label}</PoText>
					<PoText variant="meta13" tone={failed ? "textDanger" : "textSecondary"}>
						{failed ? (job.error ?? "That didn't work.") : `${step} · ${seconds}s`}
					</PoText>
				</View>
			</View>

			{failed ? (
				<View style={styles.actions}>
					<PillButton label="Try again" onPress={onRetry} />
					<PillButton label="Dismiss" variant="ghost" onPress={onDismiss} />
				</View>
			) : (
				<>
					<View style={styles.lines}>
						{LINE_WIDTHS.map((width, index) => (
							<ShimmerLine key={width} width={width} delay={index * 180} />
						))}
					</View>
					<PoText variant="meta13" tone="textTertiary">
						You can leave this screen. It'll be here when it's ready.
					</PoText>
				</>
			)}
		</View>
	);
}

function useElapsed(since: number, ticking: boolean): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!ticking) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [ticking]);
	return Math.max(0, Math.floor((now - since) / 1000));
}

/** The sparkle tile breathes while the AI works. */
function Spark({ failed }: { failed: boolean }) {
	const { colors } = usePoTheme();
	const pulse = useSharedValue(1);

	useEffect(() => {
		pulse.value = failed
			? withTiming(1)
			: withRepeat(
					withSequence(
						withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
						withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
					),
					-1,
					false,
					undefined,
					ReduceMotion.System,
				);
	}, [failed, pulse]);

	const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
	return (
		<Animated.View
			style={[
				styles.spark,
				{ backgroundColor: failed ? colors.statusCautionSubtle : colors.accentSubtle },
				style,
			]}
		>
			<Icon
				name="Filled/Sparkle"
				size={22}
				color={failed ? colors.statusCaution : colors.accentDefault}
			/>
		</Animated.View>
	);
}

/** A placeholder line that fades between two shades, staggered with its neighbours. */
function ShimmerLine({ width, delay }: { width: `${number}%`; delay: number }) {
	const { colors } = usePoTheme();
	const glow = useSharedValue(0.45);

	useEffect(() => {
		glow.value = withDelay(
			delay,
			withRepeat(
				withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
				-1,
				true,
				undefined,
				ReduceMotion.System,
			),
		);
	}, [delay, glow]);

	const style = useAnimatedStyle(() => ({ opacity: glow.value }));
	return (
		<Animated.View style={[styles.line, { width, backgroundColor: colors.bgSubtle }, style]} />
	);
}

const styles = StyleSheet.create({
	card: { gap: 16, padding: 20, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 12 },
	flex: { flex: 1, gap: 2 },
	spark: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	lines: { gap: 10 },
	line: { height: 12, borderRadius: 6 },
	actions: { flexDirection: "row", gap: 8 },
});
