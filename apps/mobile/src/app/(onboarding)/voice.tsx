import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { useVoiceInput, type VoiceStatus } from "@/lib/voice";
import { type OnboardingRoute, onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { goBack } from "@/modules/onboarding/lib/navigation";
import type { Gender } from "@/modules/onboarding/lib/options";
import {
	type FactChip,
	type FactId,
	highlightSpans,
	introAnswers,
	introChips,
	parseIntro,
} from "@/modules/onboarding/lib/parse-intro";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { pop, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

const PROMPT =
	"Tell me your name and age, your height and weight, when you wake up and sleep, how you work, and what you want to change.";

/** The step that asks for a fact that was not heard. */
const factRoute: Record<Exclude<FactId, "gender">, OnboardingRoute> = {
	name: onboardingRoutes.aboutYou,
	age: onboardingRoutes.aboutYou,
	body: onboardingRoutes.body,
	day: onboardingRoutes.yourDay,
	work: onboardingRoutes.yourDay,
	goal: onboardingRoutes.goals,
};

const genders: { id: Gender; label: string }[] = [
	{ id: "male", label: "Male" },
	{ id: "female", label: "Female" },
	{ id: "other", label: "Other" },
];

function clockLabel(seconds: number): string {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function statusLabel(status: VoiceStatus, clock: string): string {
	switch (status) {
		case "starting":
			return "Getting the mic ready…";
		case "listening":
			return `Listening · ${clock}`;
		case "stopped":
		case "idle":
			return `Paused · ${clock}`;
		case "denied":
			return "Microphone is off";
		case "unavailable":
			return "Voice isn’t available on this phone";
		case "error":
			return "Couldn’t hear you";
	}
}

/** 07 Setup · Voice ("Just talk"): live speech-to-text, understood on the phone. */
export default function VoiceScreen() {
	const { colors } = usePoTheme();
	const applyIntro = useOnboardingStore((state) => state.applyIntro);
	const setAnswer = useOnboardingStore((state) => state.set);
	const speech = useVoiceInput();
	const { start, stop } = speech;
	const [gender, setGender] = useState<Gender | undefined>();
	const [pickingGender, setPickingGender] = useState(false);

	useEffect(() => {
		void start();
	}, [start]);

	const facts = useMemo(() => {
		const parsed = parseIntro(speech.transcript);
		return gender ? { ...parsed, gender } : parsed;
	}, [speech.transcript, gender]);
	const chips = useMemo(() => introChips(facts), [facts]);
	const spans = useMemo(
		() => highlightSpans(speech.transcript, facts.highlights),
		[speech.transcript, facts.highlights],
	);
	const topics = new Set(chips.map((chip) => chip.fact));
	const known = new Set(chips.filter((chip) => chip.known).map((chip) => chip.fact));
	const heard = speech.transcript.length > 0;
	const listening = speech.status === "listening" || speech.status === "starting";
	const blocked =
		speech.status === "denied" || speech.status === "unavailable" || speech.status === "error";
	const clock = clockLabel(speech.seconds);

	/** Keeps whatever was understood, then moves on. */
	const finish = (route: OnboardingRoute) => {
		stop();
		if (known.size > 0) applyIntro(introAnswers(facts));
		else setAnswer("path", "steps");
		router.push(route);
	};

	const onFact = (chip: FactChip) => {
		haptics.tap();
		if (chip.fact === "gender") setPickingGender((value) => !value);
		else finish(factRoute[chip.fact]);
	};

	return (
		<OnboardingScreen
			glow="statusViolet"
			footer={
				<>
					{blocked ? null : (
						<Recorder
							listening={listening}
							levels={speech.levels}
							clock={clock}
							onToggle={() => (listening ? stop() : void start())}
						/>
					)}
					<View style={styles.footerRow}>
						<PillButton
							variant="secondary"
							label="Fix something"
							style={styles.flex}
							disabled={!heard}
							onPress={() => {
								haptics.tap();
								finish(onboardingRoutes.aboutYou);
							}}
						/>
						<PillButton
							label="Looks right"
							style={styles.flex}
							disabled={known.size === 0}
							onPress={() =>
								finish(facts.name ? onboardingRoutes.building : onboardingRoutes.aboutYou)
							}
						/>
					</View>
				</>
			}
		>
			<SetupTop
				onBack={() => {
					stop();
					goBack(onboardingRoutes.voice);
				}}
				actionLabel="Type instead"
				onAction={() => finish(onboardingRoutes.aboutYou)}
			/>
			<View style={styles.gap20} />
			<View
				style={[
					styles.listening,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View
					style={[
						styles.dot8,
						{ backgroundColor: listening ? colors.statusDanger : colors.textTertiary },
					]}
				/>
				<PoText variant="meta13">{statusLabel(speech.status, clock)}</PoText>
			</View>
			<View style={styles.gap16} />
			{blocked ? (
				<Blocked status={speech.status} onRetry={start} onSettings={speech.openSettings} />
			) : heard ? (
				<PoText variant="title18" tone="textSecondary" accessibilityLiveRegion="polite">
					{spans.map((span, index) =>
						span.fact ? (
							<PoText key={`${index}-${span.text}`} variant="title18">
								{span.text}
							</PoText>
						) : (
							span.text
						),
					)}
				</PoText>
			) : (
				<PoText variant="title18" tone="textTertiary">
					{PROMPT}
				</PoText>
			)}
			<View style={styles.gap20} />
			{heard ? (
				<>
					<Animated.View entering={FadeIn} style={styles.understood}>
						<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
						<PoText variant="eyebrow11" tone="textSecondary">
							{`I understood ${known.size} of ${topics.size}`}
						</PoText>
					</Animated.View>
					<View style={styles.gap10} />
					<View style={styles.facts}>
						{chips.map((chip) =>
							chip.known ? (
								<Animated.View
									key={chip.id}
									entering={pop()}
									style={[
										styles.fact,
										{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
									]}
								>
									<Checkbox checked size={24} />
									<View>
										<PoText variant="eyebrow11" tone="textTertiary">
											{chip.label}
										</PoText>
										<PoText variant="meta13">{chip.value}</PoText>
									</View>
								</Animated.View>
							) : (
								<Animated.View key={chip.id} entering={FadeIn}>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`Add ${chip.value}`}
										onPress={() => onFact(chip)}
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
												{chip.label}
											</PoText>
											<PoText variant="meta13" tone="textSecondary">
												{chip.value}
											</PoText>
										</View>
									</Pressable>
								</Animated.View>
							),
						)}
					</View>
					{pickingGender && !facts.gender ? (
						<Animated.View entering={FadeIn} style={styles.genderRow}>
							{genders.map((option) => (
								<Pressable
									key={option.id}
									accessibilityRole="button"
									onPress={() => {
										haptics.select();
										setGender(option.id);
										setPickingGender(false);
									}}
									style={({ pressed }) => [
										styles.genderOption,
										{
											backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
											borderColor: colors.borderDefault,
										},
									]}
								>
									<PoText variant="meta13">{option.label}</PoText>
								</Pressable>
							))}
						</Animated.View>
					) : null}
				</>
			) : null}
		</OnboardingScreen>
	);
}

type BlockedProps = { status: VoiceStatus; onRetry: () => Promise<void>; onSettings: () => void };

/** Mic off, no recogniser, or a failure: say so and offer the way forward. */
function Blocked({ status, onRetry, onSettings }: BlockedProps) {
	const { colors } = usePoTheme();
	const copy =
		status === "denied"
			? "Allow the microphone in Settings to talk, or type your answers instead."
			: status === "unavailable"
				? "This phone has no speech recognition service. Type your answers instead; it takes about a minute."
				: "Something stopped the recording. Try again, or type your answers instead.";

	return (
		<View
			style={[
				styles.blocked,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<Icon name="Mic" size={20} color={colors.textSecondary} />
			<PoText variant="body15" tone="textSecondary">
				{copy}
			</PoText>
			{status === "denied" ? (
				<PillButton variant="secondary" label="Open Settings" onPress={onSettings} />
			) : status === "error" ? (
				<PillButton variant="secondary" label="Try again" onPress={() => void onRetry()} />
			) : null}
		</View>
	);
}

type RecorderProps = { listening: boolean; levels: number[]; clock: string; onToggle: () => void };

function Recorder({ listening, levels, clock, onToggle }: RecorderProps) {
	const { colors } = usePoTheme();

	return (
		<View
			style={[
				styles.recorder,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View
				style={[
					styles.dot10,
					{ backgroundColor: listening ? colors.statusDanger : colors.textTertiary },
				]}
			/>
			<View style={styles.wave}>
				{levels.map((level, index) => (
					<WaveBar
						key={`bar-${index}`}
						level={level}
						color={listening ? colors.textPrimary : colors.textTertiary}
					/>
				))}
			</View>
			<PoText variant="mono13">{clock}</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={listening ? "Pause recording" : "Resume recording"}
				onPress={() => {
					haptics.tap();
					onToggle();
				}}
				style={[styles.stop, { backgroundColor: colors.statusDanger }]}
			>
				{listening ? (
					<View style={[styles.square, { backgroundColor: colors.textOnAccent }]} />
				) : (
					<Icon name="Mic" color={colors.textOnAccent} />
				)}
			</Pressable>
		</View>
	);
}

const BAR_MIN = 3;
const BAR_MAX = 28;

/** One waveform bar, its height following the measured loudness. */
function WaveBar({ level, color }: { level: number; color: string }) {
	const style = useAnimatedStyle(() => ({
		height: withTiming(BAR_MIN + level * (BAR_MAX - BAR_MIN), { duration: 100 }),
	}));
	return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
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
	genderRow: { flexDirection: "row", gap: 8, marginTop: 12 },
	genderOption: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, borderWidth: 1 },
	blocked: { gap: 14, padding: 20, borderRadius: 24, borderWidth: 1, alignItems: "flex-start" },
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
