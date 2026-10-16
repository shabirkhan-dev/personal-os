import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { Icon } from "@/components/icons";
import { ScreenTitle, Segments } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { deleteSkill, saveSkill } from "../data/training-actions";
import { TRAINING_SKILL_JOB } from "../hooks/training-ui-store";
import { useTraining } from "../hooks/use-training";
import { SKILLS } from "../lib/library";
import { SPORT_LABELS, type Skill, type Sport } from "../lib/training-model";
import { trainingAiMessage, useTrainingAi } from "../services/training-ai";
import { SPORT_TONES } from "./home-cards";
import { TrainingImage } from "./training-image";
import { TrainingScreen } from "./training-screen";

const PHOTO_BY_SPORT: Partial<Record<Sport, string>> = {
	running: "mountain-run",
	boxing: "shadow-boxing",
	yoga: "yoga",
	football: "football",
	volleyball: "volleyball",
};

/** Skills: each one a ladder of steps, with the next step to work on. */
export function SkillsScreen() {
	const { colors } = usePoTheme();
	const { skills, settings } = useTraining();
	const ai = useTrainingAi();
	const job = useAiJobs((state) => state.jobs[TRAINING_SKILL_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [open, setOpen] = useState<Skill | null>(null);
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	const current = open ? (skills.find((skill) => skill.id === open.id) ?? null) : null;
	const sportNames = [...new Set(skills.map((skill) => SPORT_LABELS[skill.sport]))];
	const suggestions = SKILLS.filter((skill) => !skills.some((item) => item.name === skill.name));

	const build = () => {
		const skillName = name.trim();
		if (!skillName) return;
		setAdding(false);
		setName("");
		if (!ai.available) {
			setNotice(
				"Building a new skill needs a connection and sign-in. Pick one of the ready-made skills meanwhile.",
			);
			return;
		}
		const sport = settings.sports[0] ?? "calisthenics";
		startJob(TRAINING_SKILL_JOB, `Building ${skillName}`, async () => {
			try {
				const result = await ai.skill(skillName, sport);
				await saveSkill({
					name: skillName,
					sport,
					photo: PHOTO_BY_SPORT[sport] ?? "push-ups",
					steps: result.steps,
					done: 0,
				});
			} catch (error) {
				throw new Error(trainingAiMessage(error), { cause: error });
			}
		});
	};

	return (
		<TrainingScreen
			action={{ icon: "Line/Plus", label: "Add a skill", onPress: () => setAdding(true) }}
		>
			<ScreenTitle
				eyebrow={`${sportNames.join(" · ") || "Skills"} · ${skills.length} skill${skills.length === 1 ? "" : "s"}`}
				title="Skills"
			/>
			{job ? (
				<AiWorkingCard
					job={job}
					steps={["Reading the skill", "Breaking it into steps", "Saving your ladder"]}
					onRetry={() => retryJob(TRAINING_SKILL_JOB)}
					onDismiss={() => dismissJob(TRAINING_SKILL_JOB)}
				/>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			{skills.map((skill) => {
				const finished = skill.done >= skill.steps.length;
				const tone = finished
					? "statusSuccess"
					: SPORT_TONES[skill.sport] === "textTertiary"
						? "accentDefault"
						: SPORT_TONES[skill.sport];
				return (
					<Pressable
						key={skill.id}
						accessibilityRole="button"
						onPress={() => setOpen(skill)}
						style={[
							styles.skill,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<TrainingImage photo={skill.photo} size={64} radius={16} />
						<View style={styles.flex}>
							<View style={styles.head}>
								<PoText variant="title18" style={styles.flex} numberOfLines={1}>
									{skill.name}
								</PoText>
								<PoText variant="mono13" tone={finished ? "textSuccess" : "textTertiary"}>
									{`Step ${Math.min(skill.done + 1, skill.steps.length)} of ${skill.steps.length}`}
								</PoText>
							</View>
							<Segments total={skill.steps.length} done={skill.done} doneTone={tone} />
							<PoText
								variant="meta13"
								tone={finished ? "textSuccess" : "textSecondary"}
								numberOfLines={1}
							>
								{finished ? "Done · keep it in warm-ups" : `Next: ${skill.steps[skill.done] ?? ""}`}
							</PoText>
						</View>
					</Pressable>
				);
			})}
			<Pressable
				accessibilityRole="button"
				onPress={() => setAdding(true)}
				style={[styles.add, { borderColor: colors.borderStrong }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					Add a skill · AI builds the steps
				</PoText>
			</Pressable>

			<Sheet visible={current !== null} title={current?.name ?? ""} onClose={() => setOpen(null)}>
				{current ? (
					<View style={styles.sheet}>
						{current.steps.map((step, index) => (
							<View key={step} style={styles.step}>
								<Checkbox checked={index < current.done} />
								<PoText
									variant="row15"
									tone={
										index < current.done
											? "textSecondary"
											: index === current.done
												? "textPrimary"
												: "textTertiary"
									}
									style={styles.flex}
								>
									{step}
								</PoText>
							</View>
						))}
						{current.done < current.steps.length ? (
							<PillButton
								label="I can do this step"
								onPress={() => {
									haptics.success();
									void saveSkill({ ...current, done: current.done + 1 });
								}}
							/>
						) : null}
						{current.done > 0 ? (
							<PillButton
								label="Back a step"
								variant="secondary"
								onPress={() => void saveSkill({ ...current, done: current.done - 1 })}
							/>
						) : null}
						<PillButton
							label="Remove skill"
							variant="ghost"
							onPress={() => {
								void deleteSkill(current);
								setOpen(null);
							}}
						/>
					</View>
				) : null}
			</Sheet>

			<Sheet
				visible={adding}
				title="Add a skill"
				onClose={() => setAdding(false)}
				action={{ label: "Build it", onPress: build }}
			>
				<View style={styles.sheet}>
					<TextField
						label="Skill"
						value={name}
						onChangeText={setName}
						placeholder="Planche, 10 km, double-under…"
						onSubmitEditing={build}
					/>
					{suggestions.length > 0 ? (
						<>
							<PoText variant="eyebrow11" tone="textTertiary">
								Ready-made
							</PoText>
							{suggestions.map((skill) => (
								<Pressable
									key={skill.name}
									accessibilityRole="button"
									onPress={() => {
										haptics.tap();
										void saveSkill({
											name: skill.name,
											sport: skill.sport,
											photo: skill.photo,
											steps: skill.steps,
											done: 0,
										});
										setAdding(false);
									}}
									style={styles.step}
								>
									<TrainingImage photo={skill.photo} size={40} radius={10} />
									<View style={styles.flex}>
										<PoText variant="row15">{skill.name}</PoText>
										<PoText
											variant="meta13"
											tone="textSecondary"
										>{`${skill.steps.length} steps · ${SPORT_LABELS[skill.sport]}`}</PoText>
									</View>
								</Pressable>
							))}
						</>
					) : null}
				</View>
			</Sheet>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	skill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 12,
		borderRadius: 26,
		borderWidth: 1,
	},
	head: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 6 },
	add: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 56,
		borderRadius: 28,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	sheet: { gap: 10 },
	step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
});
