import { useMemo, useState } from "react";
import { ShareTemplateButton } from "@/modules/templates/components/share-template-button";
import { shareProgram } from "@/modules/templates/services/share-template";
import { Pressable, StyleSheet, View } from "react-native";
import { showDialog } from "@/components/ui/dialog";
import { EmptyCard, Footer, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { deleteProgram, endProgram } from "../data/training-actions";
import { useActiveProgram, useTraining } from "../hooks/use-training";
import { EQUIPMENT_LABELS } from "../lib/exercise-guide";
import type { Exercise } from "../lib/library";
import { setsLabel } from "../lib/library";
import { materialize, programById } from "../lib/programs/engine";
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

	const failed = (error: unknown) => {
		console.error("[training] could not save", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const stop = () =>
		showDialog(
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
		showDialog(`Delete ${program.title}?`, "This can't be undone. Logged sessions stay.", [
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

	return (
		<TrainingScreen
			action={{
				icon: "Filled/Edit",
				label: "Edit program",
				onPress: () => trainingRoutes.builder({ id }),
			}}
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
			<TrainingImage size={140} fill radius={28} />
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
						"Each exercise has a range. Hit the target on every set and the next session asks for a little more.",
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
			<ShareTemplateButton share={() => shareProgram(program)} />
			<Footer>
				<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
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
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	points: { gap: 8 },
	point: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
	dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
