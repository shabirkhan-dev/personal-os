import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { saveSettings } from "../data/food-actions";
import { bodyLine, useBody } from "../hooks/use-body";
import { useFood } from "../hooks/use-food";
import { ACTIVITY, type Activity, type Goal } from "../lib/food-model";
import { ACTIVITY_LABELS, goalWeight, targetsFor } from "../lib/targets";
import { FoodScreen } from "./food-screen";
import { Card, GoalCard } from "./home-cards";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const number = (text: string) => {
	const value = Number(text.replace(",", "."));
	return Number.isFinite(value) && value > 0 ? value : null;
};

/** Goal and targets: change the goal, activity, own numbers, weigh-in day and food budget. */
export function GoalScreen() {
	const data = useFood();
	const body = useBody();
	const { settings } = data;
	const [goal, setGoal] = useState<Goal>(settings.goal);
	const [activity, setActivity] = useState<Activity>(settings.activity);
	const suggested = targetsFor(body, goal, activity);
	const same = goal === settings.goal && activity === settings.activity && settings.setUp;
	const [kcal, setKcal] = useState(String(settings.targets.kcal));
	const [protein, setProtein] = useState(String(settings.targets.protein));
	const [goalKg, setGoalKg] = useState(String(settings.goalKg));
	const [budget, setBudget] = useState(String(settings.weeklyBudget));
	const [weighInDay, setWeighInDay] = useState(settings.weighInDay);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const pick = (next: { goal?: Goal; activity?: Activity }) => {
		const targets = targetsFor(body, next.goal ?? goal, next.activity ?? activity);
		if (next.goal) {
			setGoal(next.goal);
			setGoalKg(String(goalWeight(next.goal, data.weighIns.at(-1)?.kg ?? body.weightKg)));
		}
		if (next.activity) setActivity(next.activity);
		setKcal(String(targets.kcal));
		setProtein(String(targets.protein));
	};

	const save = () => {
		const ownKcal = number(kcal) ?? suggested.kcal;
		const ownProtein = number(protein) ?? suggested.protein;
		const fat = Math.round((ownKcal * 0.26) / 9);
		const carbs = Math.max(0, Math.round((ownKcal - ownProtein * 4 - fat * 9) / 4));
		const current = data.weighIns.at(-1)?.kg ?? body.weightKg;
		const changedGoal = !settings.setUp || goal !== settings.goal;
		setSaving(true);
		saveSettings({
			...settings,
			setUp: true,
			goal,
			activity,
			targets: {
				kcal: Math.round(ownKcal),
				protein: Math.round(ownProtein),
				carbs,
				fat,
				waterMl: suggested.waterMl,
			},
			startKg: changedGoal ? current : settings.startKg,
			startedOn: changedGoal ? dayKey() : settings.startedOn,
			goalKg: number(goalKg) ?? goalWeight(goal, current),
			weeklyBudget: Math.round(number(budget) ?? settings.weeklyBudget),
			weighInDay,
		})
			.then(() => {
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[food] could not save the goal", error);
				setNotice("Couldn't save on this phone. Try again.");
				setSaving(false);
			});
	};

	return (
		<FoodScreen>
			<ScreenTitle eyebrow="Food · goal and targets" title="What you're eating for" />
			<GoalCard
				goal={goal}
				onGoal={(next) => pick({ goal: next })}
				targets={{
					...suggested,
					kcal: number(kcal) ?? suggested.kcal,
					protein: number(protein) ?? suggested.protein,
				}}
				from={bodyLine(body, activity)}
				busy={saving}
				onStart={save}
				action={same ? "Save changes" : "Use these"}
			/>
			<SectionLabel>How active you are</SectionLabel>
			<View style={styles.chips}>
				{ACTIVITY.map((option) => (
					<FilterChip
						key={option}
						label={ACTIVITY_LABELS[option]}
						selected={activity === option}
						onPress={() => pick({ activity: option })}
					/>
				))}
			</View>
			<SectionLabel>Your own numbers</SectionLabel>
			<Card>
				<TextField
					label="Calories a day"
					value={kcal}
					onChangeText={setKcal}
					keyboardType="number-pad"
					suffix="kcal"
				/>
				<TextField
					label="Protein a day"
					value={protein}
					onChangeText={setProtein}
					keyboardType="number-pad"
					suffix="g"
				/>
				<TextField
					label="Goal weight"
					value={goalKg}
					onChangeText={setGoalKg}
					keyboardType="decimal-pad"
					suffix="kg"
				/>
				<TextField
					label="Food budget a week"
					value={budget}
					onChangeText={setBudget}
					keyboardType="number-pad"
					suffix="Rs"
					onSubmitEditing={save}
				/>
			</Card>
			<SectionLabel>Weigh-in day</SectionLabel>
			<View style={styles.chips}>
				{WEEKDAYS.map((label, index) => (
					<FilterChip
						key={label}
						label={label}
						selected={weighInDay === index}
						onPress={() => setWeighInDay(index)}
					/>
				))}
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<PoText variant="meta13" tone="textTertiary" style={styles.note}>
				Targets are estimates from your height, weight and age, not medical advice. If you have a
				health condition, check them with a doctor or dietitian.
			</PoText>
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	note: { paddingHorizontal: 6 },
});
