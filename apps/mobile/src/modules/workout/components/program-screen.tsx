import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, Footer, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { FilterChip } from "@/components/module-ui";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { deleteProgram, endProgram, saveProgress } from "../data/training-actions";
import { useActiveProgram, useTraining } from "../hooks/use-training";
import { EQUIPMENT_LABELS, exerciseById } from "../lib/exercise-guide";
import type { Exercise } from "../lib/library";
import { setsLabel } from "../lib/library";
import { chainsIn, defaultStep, materialize, pickRung, programById } from "../lib/programs/engine";
import { CHAIN_LABELS, CHAINS, type ChainId } from "../lib/programs/program-model";
import { heroOf } from "../lib/photos";
import { weekDays } from "../lib/training-math";
import { trainingRoutes } from "../navigation";
import { ExerciseThumb } from "./exercise-demo";
import { Card, CardHead } from "./home-cards";
import { HowToSheet, type HowToTarget, plannedLine } from "./how-to-sheet";
import { programDays, programMeta, weekLabel } from "./program-cards";
import { StartProgramSheet } from "./start-program-sheet";
import { TrainingImage } from "./training-image";
import { TrainingScreen } from "./training-screen";

/** One program: what it's for, how it works, your levels, every session, and Start. */
export function ProgramScreen({ id }: { id: string }) {
	const { colors } = usePoTheme();
	const data = useTraining();
	const now = useNow();
	const active = useActiveProgram(data, now);
	const program = programById(data.programs, id);
	const [starting, setStarting] = useState(false);
	const [howTo, setHowTo] = useState<HowToTarget | null>(null);
	const [level, setLevel] = useState<ChainId | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const isActive = active?.program.id === id;
	const week = isActive && active && !active.finished && !active.upcoming ? active.week : 1;

	const context = useMemo(
		() => ({ programs: data.programs, progress: data.progress, settings: data.settings }),
		[data.programs, data.progress, data.settings],
	);

	if (!program) {
		return (
			<TrainingScreen>
				<EmptyCard icon="List" title="Program not found" body="It may have been deleted.">
					<PillButton label="All programs" onPress={trainingRoutes.programs} />
				</EmptyCard>
			</TrainingScreen>
		);
	}

	const custom = program.source !== "built-in";
	const chains = chainsIn(program);
	const failed = (error: unknown) => {
		console.error("[training] could not save", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const stop = () =>
		Alert.alert(
			"End this program?",
			"Your levels and sessions stay. This week goes back to your usual plan.",
			[
				{ text: "Keep going", style: "cancel" },
				{
					text: "End it",
					style: "destructive",
					onPress: () => void endProgram(data.settings).catch(failed),
				},
			],
		);

	const remove = () =>
		Alert.alert(`Delete ${program.title}?`, "This can't be undone. Logged sessions stay.", [
			{ text: "Keep", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					const ending = isActive ? endProgram(data.settings) : Promise.resolve();
					ending
						.then(() => deleteProgram(program))
						.then(() => trainingRoutes.back("/training/programs"))
						.catch(failed);
				},
			},
		]);

	const levelOf = (chain: ChainId) => {
		const saved = data.progress.get(chain);
		const rung = pickRung(
			chain,
			saved?.step ?? defaultStep(chain, program.level),
			data.settings.equipment,
		);
		return { rung, saved };
	};

	return (
		<TrainingScreen
			action={
				custom
					? {
							icon: "Filled/Edit",
							label: "Edit program",
							onPress: () => trainingRoutes.builder({ id }),
						}
					: { icon: "Filled/Calendar", label: "This week", onPress: trainingRoutes.week }
			}
		>
			<ScreenTitle eyebrow={programMeta(program)} title={program.title}>
				<MetaChip icon="Filled/Calendar" label={`${program.weeks} weeks`} />
				<MetaChip icon="Clock" label={programDays(program)} />
				{program.equipment.length > 0 ? (
					<MetaChip
						icon="Dumbbell"
						label={program.equipment.map((item) => EQUIPMENT_LABELS[item]).join(", ")}
					/>
				) : (
					<MetaChip icon="Dumbbell" label="No equipment" />
				)}
			</ScreenTitle>
			<TrainingImage photo={heroOf(program.photo)} size={180} fill radius={28} />
			{isActive && active ? (
				<Card>
					<PoText variant="eyebrow11" tone="accentDefault">
						{active.finished
							? "Program done"
							: active.upcoming
								? "Starts Monday"
								: `Week ${active.week} of ${program.weeks} · ${weekLabel(program, active.week)}`}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{active.finished
							? "Start it again to repeat it with your new levels, or pick another program."
							: active.upcoming
								? "This week stays as it was. Week 1 begins on Monday."
								: weekLabel(program, active.week) === "Light week"
									? "Fewer sets this week so you recover and come back stronger."
									: weekLabel(program, active.week) === "Test week"
										? "One all-out set per exercise. It sets your targets."
										: "Hit the target on every set and it goes up next time."}
					</PoText>
				</Card>
			) : null}
			<Card>
				<PoText variant="title18">{program.goal || "The goal"}</PoText>
				{program.summary ? (
					<PoText variant="body15" tone="textSecondary">
						{program.summary}
					</PoText>
				) : null}
				<View style={styles.points}>
					{[
						chains.length > 0
							? "Each exercise has a rep range. Hit the top on every set and the next session adds a rep; past the top you move to a harder variation."
							: null,
						program.deloadEvery
							? `Every ${program.deloadEvery}th week is lighter so you recover.`
							: null,
						program.testWeeks
							? "Week 1 and the last week test your maximums, so you see the progress."
							: null,
						"Team days stay put, legs never land the day before a match, and sessions fit your time.",
					]
						.filter((point): point is string => point !== null)
						.map((point) => (
							<View key={point} style={styles.point}>
								<View style={[styles.dot, { backgroundColor: colors.accentDefault }]} />
								<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
									{point}
								</PoText>
							</View>
						))}
				</View>
			</Card>
			{chains.length > 0 ? (
				<Card>
					<CardHead title="Your levels" right="Tap to change" />
					{chains.map((chain) => {
						const { rung, saved } = levelOf(chain);
						return (
							<Pressable
								key={chain}
								accessibilityRole="button"
								onPress={() => setLevel(chain)}
								style={styles.row}
							>
								{rung ? (
									<ExerciseThumb name={rung.exercise.name} photo={rung.exercise.photo} size={44} />
								) : null}
								<View style={styles.flex}>
									<PoText variant="eyebrow11" tone="textTertiary">
										{CHAIN_LABELS[chain]}
									</PoText>
									<PoText variant="row15">
										{rung?.exercise.name ?? "Needs equipment you don't have"}
									</PoText>
								</View>
								<PoText variant="mono13" tone="textSecondary">
									{saved && rung && saved.step === rung.step
										? `${saved.target}${rung.exercise.unit === "s" ? " s" : ""}`
										: `step ${(rung?.step ?? 0) + 1}/${CHAINS[chain].length}`}
								</PoText>
							</Pressable>
						);
					})}
				</Card>
			) : null}
			{program.sessions.map((session) => {
				const template = materialize(program, session.key, week, context);
				return (
					<Card key={session.key}>
						<CardHead
							title={session.title}
							right={template ? `${template.short}${isActive ? ` · week ${week}` : ""}` : ""}
						/>
						{template?.exercises.map((exercise: Exercise, index) => (
							<Pressable
								key={`${exercise.name}-${index}`}
								accessibilityRole="button"
								accessibilityHint="Shows how to do it"
								onPress={() => setHowTo({ ...exercise, line: plannedLine(exercise) })}
								style={styles.row}
							>
								<ExerciseThumb name={exercise.name} photo={exercise.photo} size={44} />
								<View style={styles.flex}>
									<PoText variant="row15">{exercise.name}</PoText>
									<PoText variant="meta13" tone="textSecondary">
										{exercise.note}
									</PoText>
								</View>
								<PoText variant="mono13" tone="textSecondary">
									{setsLabel(exercise)}
								</PoText>
							</Pressable>
						)) ?? (
							<PoText variant="meta13" tone="textSecondary">
								Needs equipment you don't have.
							</PoText>
						)}
					</Card>
				);
			})}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				{custom ? (
					<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
				) : null}
				{isActive && active && !active.finished ? (
					<PillButton label="End program" variant="secondary" style={styles.flex} onPress={stop} />
				) : null}
				<PillButton
					label={
						isActive && active && !active.finished
							? "This week"
							: isActive
								? "Start again"
								: "Start program"
					}
					style={styles.flex}
					onPress={() =>
						isActive && active && !active.finished ? trainingRoutes.week() : setStarting(true)
					}
				/>
			</Footer>
			<StartProgramSheet
				program={program}
				settings={data.settings}
				progress={data.progress}
				plan={data.plans.find((item) => item.id === weekDays(now)[0]) ?? null}
				activities={data.activities}
				switchingFrom={active && !isActive && !active.finished ? active.program.title : null}
				visible={starting}
				onClose={() => setStarting(false)}
				onStarted={() => {
					setStarting(false);
					trainingRoutes.today();
				}}
			/>
			<HowToSheet target={howTo} onClose={() => setHowTo(null)} />
			<LevelSheet
				chain={level}
				current={level ? (levelOf(level).rung?.step ?? 0) : 0}
				onClose={() => setLevel(null)}
				onPick={(chain, step) => {
					haptics.tap();
					const first = exerciseById(String(CHAINS[chain][step]));
					const item = program.sessions
						.flatMap((session) => session.items)
						.find((candidate) => candidate.kind === "chain" && candidate.chain === chain);
					const range =
						item?.kind === "chain" ? (first?.unit === "s" ? item.hold : item.range) : [8, 12];
					setLevel(null);
					saveProgress({
						id: chain,
						step,
						target: range[0] ?? 8,
						kg: null,
						misses: 0,
						updatedAt: new Date().toISOString(),
					}).catch(failed);
				}}
			/>
		</TrainingScreen>
	);
}

/** Moves one ladder by hand: "I can already do pull-ups". */
function LevelSheet({
	chain,
	current,
	onPick,
	onClose,
}: {
	chain: ChainId | null;
	current: number;
	onPick: (chain: ChainId, step: number) => void;
	onClose: () => void;
}) {
	return (
		<Sheet visible={chain !== null} title={chain ? CHAIN_LABELS[chain] : ""} onClose={onClose}>
			<View style={styles.levels}>
				<PoText variant="meta13" tone="textSecondary">
					Pick the hardest variation you can do for a few clean reps. Your next sessions start
					there.
				</PoText>
				<View style={styles.wrap}>
					{chain
						? CHAINS[chain].map((id, index) => (
								<FilterChip
									key={id}
									label={exerciseById(id)?.name ?? id}
									selected={index === current}
									onPress={() => onPick(chain, index)}
								/>
							))
						: null}
				</View>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	points: { gap: 8 },
	point: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
	dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	levels: { gap: 12, paddingBottom: 8 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
