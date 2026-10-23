import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, Footer, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { savePlan } from "../data/training-actions";
import { startSession } from "../hooks/live-actions";
import { useTrainingToday } from "../hooks/use-training";
import { type Exercise, setsLabel, TEMPLATES, templateById } from "../lib/library";
import { guideFor } from "../lib/exercise-guide";
import { heroOf } from "../lib/photos";
import { withSlot } from "../lib/training-math";
import { SPORT_LABELS } from "../lib/training-model";
import { ExerciseThumb } from "./exercise-demo";
import { Card, CardHead } from "./home-cards";
import { HowToSheet, plannedLine } from "./how-to-sheet";
import { TrainingImage } from "./training-image";
import { TrainingScreen } from "./training-screen";
import { trainingRoutes } from "../navigation";

/** Session plan: the photo, length and effort, every exercise with its sets, then Start. */
export function PlanScreen({ templateId }: { templateId?: string }) {
	const { colors } = usePoTheme();
	const { data, plan, today, template: todays } = useTrainingToday();
	const [swapping, setSwapping] = useState(false);
	const [howTo, setHowTo] = useState<Exercise | null>(null);
	const template = templateById(templateId) ?? todays ?? templateById("pull-core");
	if (!template) {
		return (
			<TrainingScreen>
				<EmptyCard icon="Dumbbell" title="No session" body="Pick a session from the week." />
			</TrainingScreen>
		);
	}
	const isToday = template.id === todays?.id;
	const options = TEMPLATES.filter(
		(item) => data.settings.sports.includes(item.sport) || item.sport === "yoga",
	);

	const swap = (id: string) => {
		setSwapping(false);
		if (!plan) return;
		haptics.tap();
		void savePlan(plan.id, withSlot(plan.slots, today, id)).catch((error: unknown) =>
			console.error("[training] could not swap", error),
		);
	};

	return (
		<TrainingScreen
			action={{ icon: "Filled/Calendar", label: "This week", onPress: trainingRoutes.week }}
		>
			<ScreenTitle
				eyebrow={
					template.program
						? `${isToday ? `Today · ${clockOf(data.settings.trainAt)}` : "Session"} · ${template.program.title} · week ${template.program.week}${template.program.kind === "deload" ? " · light" : template.program.kind === "test" ? " · test" : ""}`
						: `${isToday ? `Today · ${clockOf(data.settings.trainAt)}` : "Session"} · ${SPORT_LABELS[template.sport]}`
				}
				title={template.title}
			>
				<MetaChip icon="Clock" label={`${template.minutes} min`} />
				<MetaChip
					icon="List"
					label={
						template.sport === "boxing"
							? `${template.rounds} rounds`
							: template.sport === "running"
								? `${template.distanceKm} km`
								: `${template.exercises.length} exercises`
					}
				/>
				<MetaChip
					icon="Lightning"
					iconTone="statusCaution"
					label={`Effort ${template.effort} of 10`}
				/>
			</ScreenTitle>
			<TrainingImage photo={heroOf(template.hero)} size={180} fill radius={28} />
			<Card>
				<CardHead
					title="The plan"
					right={`${template.exercises.length} ${template.exercises.length === 1 ? "block" : "blocks"}`}
				/>
				{template.exercises.map((exercise, index) => {
					const guided = guideFor(exercise.name) !== null;
					return (
						<Pressable
							key={`${exercise.name}-${index}`}
							accessibilityRole={guided ? "button" : undefined}
							accessibilityHint={guided ? "Shows how to do it" : undefined}
							disabled={!guided}
							onPress={() => setHowTo(exercise)}
							style={styles.row}
						>
							<ExerciseThumb name={exercise.name} photo={exercise.photo} size={48} />
							<View style={styles.flex}>
								<PoText variant="row15">{exercise.name}</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{guided ? `${exercise.note} · How to` : exercise.note}
								</PoText>
							</View>
							<PoText variant="mono13" tone="textSecondary">
								{template.sport === "boxing"
									? `${template.rounds} × ${template.roundMin} min`
									: setsLabel(exercise)}
							</PoText>
						</Pressable>
					);
				})}
			</Card>
			<Footer>
				<PillButton
					label="Swap session"
					variant="secondary"
					style={styles.flex}
					onPress={() => setSwapping(true)}
				/>
				<PillButton
					label="Start session"
					style={styles.flex}
					onPress={() => startSession(template.id)}
				/>
			</Footer>
			<HowToSheet
				target={howTo ? { ...howTo, line: plannedLine(howTo) } : null}
				onClose={() => setHowTo(null)}
			/>
			<Sheet visible={swapping} title="Swap today's session" onClose={() => setSwapping(false)}>
				<View>
					{options.map((option) => (
						<Pressable
							key={option.id}
							accessibilityRole="button"
							onPress={() => swap(option.id)}
							style={[
								styles.row,
								{ borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
							]}
						>
							<TrainingImage photo={option.photo} size={44} radius={12} />
							<View style={styles.flex}>
								<PoText variant="row15">{option.title}</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{`${SPORT_LABELS[option.sport]} · ${option.short}`}
								</PoText>
							</View>
						</Pressable>
					))}
				</View>
			</Sheet>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
