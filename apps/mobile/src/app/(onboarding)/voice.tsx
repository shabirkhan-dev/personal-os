import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
	ZoomIn,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { mockTranscript, transcriptFacts } from "@/modules/onboarding/lib/transcript";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

/** Waveform bar heights from the Figma recorder; the first 26 are already "heard". */
const WAVE = [
	3, 19, 23, 11, 3, 3, 8, 10, 3, 21, 28, 16, 4, 15, 10, 3, 3, 13, 21, 13, 8, 24, 23, 8, 4, 3, 5, 5,
	8, 24, 25, 9, 11, 19,
];
const HEARD = 26;
const WORD_MS = 140;

type Word = { text: string; fact: boolean };

/** Transcript split into words (keeping trailing spaces) so it can reveal live. */
const WORDS: readonly Word[] = mockTranscript.flatMap((span) =>
	(span.text.match(/\S+\s*|\s+/g) ?? []).map((text) => ({ text, fact: Boolean(span.fact) })),
);

/** 07 Setup · Voice ("Just talk"): mock live transcript and the facts it understood. */
export default function VoiceScreen() {
	const { colors } = usePoTheme();
	const applyTranscript = useOnboardingStore((state) => state.applyTranscript);
	const words = WORDS;
	const [revealed, setRevealed] = useState(0);
	const [recording, setRecording] = useState(true);
	const [seconds, setSeconds] = useState(0);
	const done = revealed >= words.length;

	useEffect(() => {
		if (!recording || done) return;
		const timer = setInterval(() => setRevealed((count) => count + 1), WORD_MS);
		return () => clearInterval(timer);
	}, [recording, done]);

	useEffect(() => {
		if (!recording) return;
		const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
		return () => clearInterval(timer);
	}, [recording]);

	useEffect(() => {
		if (done) setRecording(false);
	}, [done]);

	const clock = `0:${String(Math.max(seconds, done ? 21 : 0)).padStart(2, "0")}`;
	const knownFacts = transcriptFacts.filter((fact) => fact.known);
	const visibleFacts = done
		? transcriptFacts
		: knownFacts.slice(0, Math.floor((revealed / words.length) * knownFacts.length));

	const finish = (route: typeof onboardingRoutes.building | typeof onboardingRoutes.aboutYou) => {
		applyTranscript();
		router.push(route);
	};

	return (
		<OnboardingScreen
			glow="statusViolet"
			footer={
				<>
					<Recorder
						recording={recording}
						clock={clock}
						onToggle={() => setRecording((value) => !value)}
					/>
					<View style={styles.footerRow}>
						<PillButton
							variant="secondary"
							label="Fix something"
							style={styles.flex}
							onPress={() => finish(onboardingRoutes.aboutYou)}
						/>
						<PillButton
							label="Looks right"
							style={styles.flex}
							onPress={() => finish(onboardingRoutes.building)}
						/>
					</View>
				</>
			}
		>
			<SetupTop
				onBack={() => router.back()}
				actionLabel="Type instead"
				onAction={() => router.replace(onboardingRoutes.aboutYou)}
			/>
			<View style={styles.gap20} />
			<View
				style={[
					styles.listening,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={[styles.dot8, { backgroundColor: colors.statusDanger }]} />
				<PoText variant="meta13">{recording ? `Listening · ${clock}` : `Paused · ${clock}`}</PoText>
			</View>
			<View style={styles.gap16} />
			<PoText variant="title18" tone="textSecondary" accessibilityLiveRegion="polite">
				{words.slice(0, revealed).map((word, index) =>
					word.fact ? (
						<PoText key={`${index}-${word.text}`} variant="title18">
							{word.text}
						</PoText>
					) : (
						word.text
					),
				)}
			</PoText>
			<View style={styles.gap20} />
			{visibleFacts.length > 0 ? (
				<Animated.View entering={FadeIn} style={styles.understood}>
					<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
					<PoText variant="eyebrow11" tone="textSecondary">
						{`I understood ${Math.min(visibleFacts.length, knownFacts.length)} of ${transcriptFacts.length}`}
					</PoText>
				</Animated.View>
			) : null}
			<View style={styles.gap10} />
			<View style={styles.facts}>
				{visibleFacts.map((fact) =>
					fact.known ? (
						<Animated.View
							key={fact.id}
							entering={ZoomIn.springify().damping(16)}
							style={[
								styles.fact,
								{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
							]}
						>
							<Checkbox checked size={24} />
							<View>
								<PoText variant="eyebrow11" tone="textTertiary">
									{fact.label}
								</PoText>
								<PoText variant="meta13">{fact.value}</PoText>
							</View>
						</Animated.View>
					) : (
						<Animated.View key={fact.id} entering={FadeIn.delay(200)}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={`Add ${fact.value}`}
								onPress={() => finish(onboardingRoutes.aboutYou)}
								style={[
									styles.fact,
									styles.missing,
									{ backgroundColor: colors.bgApp, borderColor: colors.textTertiary },
								]}
							>
								<View style={[styles.help, { backgroundColor: colors.bgSubtle }]}>
									<Icon name="Help" size={14} color={colors.textSecondary} />
								</View>
								<View>
									<PoText variant="eyebrow11" tone="textTertiary">
										{fact.label}
									</PoText>
									<PoText variant="meta13" tone="textSecondary">
										{fact.value}
									</PoText>
								</View>
							</Pressable>
						</Animated.View>
					),
				)}
			</View>
		</OnboardingScreen>
	);
}

type RecorderProps = { recording: boolean; clock: string; onToggle: () => void };

function Recorder({ recording, clock, onToggle }: RecorderProps) {
	const { colors } = usePoTheme();

	return (
		<View
			style={[
				styles.recorder,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.dot10, { backgroundColor: colors.statusDanger }]} />
			<View style={styles.wave}>
				{WAVE.map((height, index) => (
					<WaveBar
						key={`bar-${index}`}
						height={height}
						index={index}
						active={recording}
						color={index < HEARD ? colors.textPrimary : colors.textTertiary}
					/>
				))}
			</View>
			<PoText variant="mono13">{clock}</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={recording ? "Stop recording" : "Resume recording"}
				onPress={onToggle}
				style={[styles.stop, { backgroundColor: colors.statusDanger }]}
			>
				{recording ? (
					<View style={[styles.square, { backgroundColor: colors.textOnAccent }]} />
				) : (
					<Icon name="Mic" color={colors.textOnAccent} />
				)}
			</Pressable>
		</View>
	);
}

function WaveBar({
	height,
	index,
	active,
	color,
}: {
	height: number;
	index: number;
	active: boolean;
	color: string;
}) {
	const scale = useSharedValue(1);

	useEffect(() => {
		scale.value = active
			? withDelay(
					(index % 7) * 60,
					withRepeat(
						withSequence(withTiming(0.45, { duration: 260 }), withTiming(1, { duration: 260 })),
						-1,
					),
				)
			: withTiming(1, { duration: 200 });
	}, [active, index, scale]);

	const style = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));
	return <Animated.View style={[styles.bar, { height, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	gap20: { height: 20 },
	gap16: { height: 16 },
	gap10: { height: 10 },
	listening: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 12,
		paddingRight: 14,
		paddingVertical: 7,
		borderRadius: 16,
		borderWidth: 1,
	},
	dot8: { width: 8, height: 8, borderRadius: 4 },
	dot10: { width: 10, height: 10, borderRadius: 5 },
	understood: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 },
	facts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	fact: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 6,
		paddingRight: 14,
		paddingVertical: 6,
		borderRadius: 22,
		borderWidth: 1,
	},
	missing: { borderStyle: "dashed" },
	help: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
	recorder: {
		height: 64,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 20,
		paddingRight: 8,
		borderRadius: 32,
		borderWidth: 1,
	},
	wave: { flex: 1, flexDirection: "row", alignItems: "center", gap: 3, overflow: "hidden" },
	bar: { width: 2, borderRadius: 1 },
	stop: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
	square: { width: 14, height: 14, borderRadius: 4 },
	footerRow: { flexDirection: "row", gap: 10 },
});
