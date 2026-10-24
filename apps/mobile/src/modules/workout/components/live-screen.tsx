import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, ScreenTitle, Segments } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { voiceOut } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import { useLiveSession } from "../hooks/live-store";
import { useTraining } from "../hooks/use-training";
import { guideFor } from "../lib/exercise-guide";
import { setsLabel, templateById } from "../lib/library";
import { logsSets, secondsLeft, timedSeconds, togglePause } from "../lib/live-math";
import { clockTime, lastValue } from "../lib/training-math";
import { trainingRoutes } from "../navigation";
import { useRestAlert } from "../hooks/use-rest-alert";
import { ExerciseDemo, ExerciseThumb } from "./exercise-demo";
import { Card } from "./home-cards";
import { FinishSheet } from "./finish-sheet";
import { HowToSheet, plannedLine } from "./how-to-sheet";
import { TrainingScreen } from "./training-screen";

function RestRing({ left, total }: { left: number; total: number }) {
	const { colors } = usePoTheme();
	const size = 92;
	const width = 8;
	const radius = (size - width) / 2;
	const length = 2 * Math.PI * radius;
	const share = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
	return (
		<View style={styles.ring}>
			<Svg width={size} height={size} style={StyleSheet.absoluteFill}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.bgSubtle}
					strokeWidth={width}
					fill="none"
				/>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.accentDefault}
					strokeWidth={width}
					strokeLinecap="round"
					fill="none"
					strokeDasharray={`${length * share} ${length}`}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</Svg>
			<PoText variant="title18">{clockTime(left)}</PoText>
		</View>
	);
}

/** A chip laid over the demo: How to, Pause, Resume. */
function DemoChip({
	icon,
	label,
	onPress,
}: {
	icon: "Help" | "Pause" | "Filled/Play";
	label: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			hitSlop={8}
			style={[styles.chip, { backgroundColor: colors.bgCanvas }]}
		>
			<Icon name={icon} size={14} color={colors.textPrimary} />
			<PoText variant="meta13">{label}</PoText>
		</Pressable>
	);
}

/**
 * Live session: one exercise at a time with its demo, the set to beat, a countdown for holds and
 * timed blocks, a rest timer (with an alert when the phone is locked), pause, and what's next.
 */
export function LiveScreen() {
	useKeepAwake();
	const { colors } = usePoTheme();
	const live = useLiveSession((state) => state.data);
	const hydrated = useLiveSession((state) => state.hydrated);
	const hydrate = useLiveSession((state) => state.hydrate);
	const update = useLiveSession((state) => state.update);
	const { sessions, progress } = useTraining();
	const now = useNow(1000);
	const [finishing, setFinishing] = useState(false);
	const template = live?.snapshot ?? templateById(live?.template);
	const exercise = template?.exercises[live?.exercise ?? 0];
	const [value, setValue] = useState(10);
	const [howTo, setHowTo] = useState(false);
	/** The load for weighted lifts, in kilograms. */
	const [kg, setKg] = useState(20);
	/** When the countdown for a hold or timed block started; null when it isn't running. */
	const [timerStart, setTimerStart] = useState<number | null>(null);

	useEffect(() => {
		void hydrate();
	}, [hydrate]);

	// The number to beat for each new set: last time's best, else the target.
	const key = `${live?.template}-${live?.exercise}-${live?.set}`;
	const lastKey = useRef("");
	useEffect(() => {
		if (!exercise || key === lastKey.current) return;
		lastKey.current = key;
		const done = [...(live?.sets ?? [])]
			.reverse()
			.find((set) => set.exercise === exercise.name)?.value;
		const before = lastValue(sessions, exercise.name);
		setValue(done ?? exercise.target ?? (before !== null ? before + 1 : 10));
		setTimerStart(null);
		if (exercise.weighted) {
			const lastKg = [...(live?.sets ?? []), ...sessions.flatMap((session) => session.sets)].find(
				(set) => set.exercise === exercise.name && set.kg !== undefined,
			)?.kg;
			setKg(exercise.kg ?? lastKg ?? 20);
		}
	}, [key, exercise, live?.sets, sessions]);

	const paused = live?.pausedAtMs != null;
	const restLeft =
		live?.restUntilMs && !paused
			? Math.max(0, Math.round((live.restUntilMs - now.getTime()) / 1000))
			: 0;
	const resting = restLeft > 0;
	useRestAlert(
		paused ? null : (live?.restUntilMs ?? null),
		exercise && live ? `${exercise.name}, set ${live.set + 1}. Let's go.` : "Next set. Let's go.",
	);

	const timedTotal = exercise ? timedSeconds(exercise, value) : null;
	const timerLeft =
		timerStart !== null && timedTotal !== null
			? secondsLeft(timerStart, timedTotal, now.getTime())
			: timedTotal;
	const timerRunning = timerStart !== null && timerLeft !== null && timerLeft > 0;
	const timerDone = timerStart !== null && timerLeft === 0;
	useEffect(() => {
		if (!timerDone) return;
		haptics.success();
		voiceOut.speak("Time.");
	}, [timerDone]);
	const wasResting = useRef(false);
	useEffect(() => {
		// A pause zeroes the countdown too; only a rest that ran out gets the cue.
		if (wasResting.current && !resting && !paused && exercise && live) {
			haptics.success();
			voiceOut.speak(`Rest over. ${exercise.name}, set ${live.set + 1}.`);
		}
		wasResting.current = resting;
	}, [resting, paused, exercise, live]);

	if (!hydrated) return <TrainingScreen>{null}</TrainingScreen>;
	if (!live || !template || !exercise) {
		return (
			<TrainingScreen>
				<EmptyCard
					icon="Filled/Play"
					title="No session running"
					body="Start today's session from Training's Home or the session plan."
				>
					<PillButton label="Session plan" onPress={() => trainingRoutes.plan()} />
				</EmptyCard>
			</TrainingScreen>
		);
	}

	const elapsed = Math.round(
		((live.pausedAtMs ?? now.getTime()) - live.startedAtMs - live.pausedMs) / 1000,
	);
	const lastExercise = live.exercise >= template.exercises.length - 1;
	const lastSet = live.set >= exercise.sets - 1;
	const next = lastSet ? template.exercises[live.exercise + 1] : exercise;
	const before = lastValue(sessions, exercise.name);
	const unit = exercise.unit === "min" ? "min" : exercise.unit === "s" ? "seconds" : "reps";

	const advance = (done: boolean) => {
		haptics.tap();
		setTimerStart(null);
		const logged = done && logsSets(exercise);
		update((current) => {
			if (!current) return current;
			const sets = logged
				? [
						...current.sets,
						{
							exercise: exercise.name,
							value,
							unit: exercise.unit === "s" ? ("s" as const) : ("reps" as const),
							...(exercise.weighted ? { kg } : {}),
						},
					]
				: current.sets;
			if (!done || lastSet) {
				if (lastExercise) return { ...current, sets, restUntilMs: null };
				return {
					...current,
					sets,
					exercise: current.exercise + 1,
					set: 0,
					restUntilMs: done && exercise.restS ? Date.now() + exercise.restS * 1000 : null,
				};
			}
			return {
				...current,
				sets,
				set: current.set + 1,
				restUntilMs: exercise.restS ? Date.now() + exercise.restS * 1000 : null,
			};
		});
		if (lastExercise && (lastSet || !done)) setFinishing(true);
	};

	const pauseOrResume = () => {
		haptics.tap();
		setTimerStart(null);
		update((current) => (current ? togglePause(current, Date.now()) : current));
	};
	const guided = guideFor(exercise.name) !== null;

	return (
		<TrainingScreen
			action={{ icon: "Filled/Edit", label: "Finish session", onPress: () => setFinishing(true) }}
		>
			<ScreenTitle
				eyebrow={`Exercise ${live.exercise + 1} of ${template.exercises.length} · ${clockTime(elapsed)} in`}
				title={exercise.name}
			/>
			<View>
				<ExerciseDemo name={exercise.name} photo={exercise.photo} height={220} />
				<View style={styles.overlay}>
					{guided ? <DemoChip icon="Help" label="How to" onPress={() => setHowTo(true)} /> : null}
					<View style={styles.flex} />
					<DemoChip
						icon={paused ? "Filled/Play" : "Pause"}
						label={paused ? "Resume" : "Pause"}
						onPress={pauseOrResume}
					/>
				</View>
			</View>
			{paused ? (
				<Card>
					<PoText variant="row15">Paused</PoText>
					<PoText variant="meta13" tone="textSecondary">
						The clock and rest are on hold. Resume when you're ready.
					</PoText>
				</Card>
			) : null}
			<Card>
				<PoText variant="eyebrow11" tone="textTertiary">
					{`Set ${live.set + 1} of ${exercise.sets}`}
				</PoText>
				<View style={styles.setRow}>
					<PoText variant="hero40">
						{value}
						<PoText
							variant="row15"
							tone="textSecondary"
						>{` ${unit}${exercise.each ? " each" : ""}`}</PoText>
					</PoText>
					<View style={styles.stepper}>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Less"
							onPress={() =>
								setValue((current) => Math.max(0, current - (exercise.unit === "s" ? 5 : 1)))
							}
							style={[styles.round, { backgroundColor: colors.bgSubtle }]}
						>
							<Icon name="Minus" size={18} color={colors.textPrimary} />
						</Pressable>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="More"
							onPress={() => setValue((current) => current + (exercise.unit === "s" ? 5 : 1))}
							style={[styles.round, { backgroundColor: colors.bgSubtle }]}
						>
							<Icon name="Line/Plus" size={18} color={colors.textPrimary} />
						</Pressable>
					</View>
				</View>
				{timedTotal !== null && timerLeft !== null ? (
					<PillButton
						variant="secondary"
						disabled={paused || resting}
						label={
							timerRunning
								? `Stop · ${clockTime(timerLeft)} left`
								: timerDone
									? "Time's up · tap Done"
									: `Start ${clockTime(timedTotal)} timer`
						}
						onPress={() => {
							haptics.tap();
							setTimerStart(timerStart === null ? Date.now() : null);
						}}
					/>
				) : null}
				{exercise.weighted ? (
					<View style={styles.setRow}>
						<PoText variant="title18">
							{`${kg} kg`}
							<PoText variant="meta13" tone="textSecondary">
								{"  load"}
							</PoText>
						</PoText>
						<View style={styles.stepper}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Less weight"
								onPress={() => setKg((current) => Math.max(0, current - 2.5))}
								style={[styles.round, { backgroundColor: colors.bgSubtle }]}
							>
								<Icon name="Minus" size={18} color={colors.textPrimary} />
							</Pressable>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="More weight"
								onPress={() => setKg((current) => current + 2.5)}
								style={[styles.round, { backgroundColor: colors.bgSubtle }]}
							>
								<Icon name="Line/Plus" size={18} color={colors.textPrimary} />
							</Pressable>
						</View>
					</View>
				) : null}
				{exercise.progress ? (
					<PoText variant="meta13" tone="textSecondary">
						{template.program?.kind === "test"
							? "Test set: as many clean as you can. It sets your targets."
							: `Hit ${exercise.target ?? "the target"} on every set to move up · ${exercise.note}`}
					</PoText>
				) : null}
				{before !== null && exercise.unit !== "min" ? (
					<PoText variant="meta13" tone="textSuccess">
						{`Last time ${before} · beat it by one`}
					</PoText>
				) : null}
				<Segments total={exercise.sets} done={live.set} current={live.set} />
			</Card>
			<Card>
				<View style={styles.restRow}>
					<RestRing left={resting ? restLeft : exercise.restS} total={exercise.restS || 1} />
					<View style={styles.flex}>
						<PoText variant="row15">
							{resting ? "Resting" : exercise.restS ? "Rest after this set" : "No rest needed"}
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{resting
								? "Breathe. Next set when the ring empties."
								: exercise.restS
									? `${exercise.restS} s · starts when you tap Done`
									: "Go straight on"}
						</PoText>
					</View>
				</View>
				{next ? (
					<View style={styles.next}>
						<ExerciseThumb name={next.name} photo={next.photo} size={44} radius={10} />
						<View>
							<PoText variant="eyebrow11" tone="textTertiary">
								Next
							</PoText>
							<PoText variant="row15">
								{next === exercise
									? `Set ${live.set + 2} · ${setsLabel(exercise)}`
									: `${next.name} · ${setsLabel(next)}`}
							</PoText>
						</View>
					</View>
				) : null}
			</Card>
			<Footer>
				<PillButton
					label="Skip exercise"
					variant="secondary"
					style={styles.flex}
					disabled={paused}
					onPress={() => advance(false)}
				/>
				<PillButton
					label={
						lastExercise && lastSet
							? "Done · finish"
							: resting
								? "Skip rest"
								: exercise.unit === "min"
									? "Done"
									: "Done set"
					}
					style={styles.flex}
					disabled={paused}
					onPress={() =>
						resting
							? update((current) => (current ? { ...current, restUntilMs: null } : current))
							: advance(true)
					}
				/>
			</Footer>
			<FinishSheet
				visible={finishing}
				live={live}
				template={template}
				progress={progress}
				onClose={() => setFinishing(false)}
			/>
			<HowToSheet
				target={howTo ? { ...exercise, line: plannedLine(exercise) } : null}
				onClose={() => setHowTo(false)}
			/>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	overlay: {
		position: "absolute",
		left: 16,
		right: 16,
		bottom: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		opacity: 0.9,
	},
	setRow: { flexDirection: "row", alignItems: "center" },
	stepper: { flexDirection: "row", gap: 10, marginLeft: "auto" },
	round: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	ring: { width: 92, height: 92, alignItems: "center", justifyContent: "center" },
	restRow: { flexDirection: "row", alignItems: "center", gap: 16 },
	next: { flexDirection: "row", alignItems: "center", gap: 12 },
});
