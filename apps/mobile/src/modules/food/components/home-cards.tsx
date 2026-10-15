import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, ListCard, ProgressBar } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { SlotRow, WeightTrend } from "../lib/food-math";
import { GOAL_LABELS, GOALS, type Goal, type Macros, SLOT_LABELS } from "../lib/food-model";
import { recipeById } from "../lib/recipes";
import { GOAL_ADVICE, type Targets } from "../lib/targets";
import { MealImage } from "./meal-image";

type Tone = keyof ColorTokens;

export const MACRO_TONES: Record<"protein" | "carbs" | "fat", Tone> = {
	protein: "statusDanger",
	carbs: "statusCaution",
	fat: "accentDefault",
};

export const kcalText = (value: number) => Math.round(value).toLocaleString("en-US");

export function Card({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: colors.bgSurface,
					borderColor: accent ? colors.accentDefault : colors.borderDefault,
				},
			]}
		>
			{children}
		</View>
	);
}

function Eyebrow({ left, right }: { left: string; right?: string }) {
	return (
		<View style={styles.eyebrow}>
			<PoText variant="eyebrow11" tone="textTertiary" style={styles.flex} numberOfLines={1}>
				{left}
			</PoText>
			{right ? (
				<PoText variant="mono13" tone="textSecondary">
					{right}
				</PoText>
			) : null}
		</View>
	);
}

/** Protein, carbs and fat against today's targets. */
export function MacrosCard({ eaten, targets }: { eaten: Macros; targets: Targets }) {
	const left = Math.max(0, targets.kcal - eaten.kcal);
	const columns = [
		{ key: "protein", label: "Protein" },
		{ key: "carbs", label: "Carbs" },
		{ key: "fat", label: "Fat" },
	] as const;
	return (
		<Card>
			<Eyebrow
				left="Macros"
				right={
					left > 0
						? `${kcalText(left)} kcal left`
						: `${kcalText(eaten.kcal - targets.kcal)} kcal over`
				}
			/>
			<View style={styles.macros}>
				{columns.map((column) => (
					<View key={column.key} style={styles.macro}>
						<PoText variant="text14" tone="textSecondary">
							{column.label}
						</PoText>
						<PoText variant="title18">
							{Math.round(eaten[column.key])}
							<PoText variant="text14" tone="textTertiary">
								{` / ${targets[column.key]} g`}
							</PoText>
						</PoText>
						<ProgressBar
							share={targets[column.key] > 0 ? eaten[column.key] / targets[column.key] : 0}
							tone={MACRO_TONES[column.key]}
						/>
					</View>
				))}
			</View>
		</Card>
	);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weight now, this week's change and the way to the goal. Tap to weigh in. */
export function WeightCard({
	goal,
	trend,
	startKg,
	goalKg,
	weighInDay,
	onPress,
}: {
	goal: Goal;
	trend: WeightTrend;
	startKg: number;
	goalKg: number;
	weighInDay: number;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const gain = goalKg - startKg;
	const towardGoal = trend.week !== null && (gain >= 0 ? trend.week >= 0 : trend.week <= 0);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Weight ${trend.latest} kilograms. Weigh in`}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<Eyebrow
				left={
					gain === 0
						? `${GOAL_LABELS[goal]} · hold ${goalKg} kg`
						: `${GOAL_LABELS[goal]} · ${gain > 0 ? "+" : "−"}${Math.abs(gain)} kg goal`
				}
				right={`Weigh-in ${WEEKDAYS[weighInDay] ?? "Fri"}`}
			/>
			<View style={styles.weightRow}>
				<PoText variant="display36">{trend.latest.toFixed(1)} kg</PoText>
				{trend.week !== null ? (
					<PoText variant="row15" tone={towardGoal ? "textSuccess" : "textWarning"}>
						{`${trend.week > 0 ? "+" : ""}${trend.week.toFixed(1)} this week`}
					</PoText>
				) : (
					<PoText variant="meta13" tone="textTertiary">
						Tap to weigh in
					</PoText>
				)}
			</View>
			<ProgressBar share={trend.share} tone="statusSuccess" />
			<View style={styles.weightFoot}>
				<PoText variant="mono13" tone="textTertiary">
					{startKg.toFixed(1)} start
				</PoText>
				<PoText variant="mono13" tone="textSecondary">
					{trend.done.toFixed(1)} of {trend.total} kg
				</PoText>
				<PoText variant="mono13" tone="textTertiary">
					{goalKg.toFixed(1)} goal
				</PoText>
			</View>
		</Pressable>
	);
}

/** "1.5 / 3 L water" with ten dashes and a + for one glass. */
export function WaterCard({
	ml,
	targetMl,
	onAdd,
	onLongAdd,
}: {
	ml: number;
	targetMl: number;
	onAdd: () => void;
	onLongAdd: () => void;
}) {
	const { colors } = usePoTheme();
	const filled = Math.round(Math.min(1, targetMl > 0 ? ml / targetMl : 0) * 10);
	return (
		<View
			style={[
				styles.water,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.drop, { backgroundColor: colors.accentSubtle }]}>
				<Icon name="Drop" size={20} color={colors.accentDefault} />
			</View>
			<View style={styles.flex}>
				<PoText variant="row15">
					{(ml / 1000).toFixed(1).replace(/\.0$/, "")}
					<PoText variant="text14" tone="textSecondary">
						{` / ${(targetMl / 1000).toFixed(1).replace(/\.0$/, "")} L water`}
					</PoText>
				</PoText>
				<View style={styles.dashes}>
					{Array.from({ length: 10 }, (_, step) => step).map((step) => (
						<View
							key={step}
							style={[
								styles.dash,
								{ backgroundColor: step < filled ? colors.accentDefault : colors.borderDefault },
							]}
						/>
					))}
				</View>
			</View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Add a glass of water"
				accessibilityHint="Long press for other amounts"
				onPress={() => {
					haptics.tap();
					onAdd();
				}}
				onLongPress={onLongAdd}
				style={[styles.plus, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Line/Plus" size={18} color={colors.textPrimary} />
			</Pressable>
		</View>
	);
}

/** Today's five slots with photos; planned ones have Log. */
export function MealsCard({
	rows,
	onRow,
	onLog,
}: {
	rows: readonly SlotRow[];
	onRow: (row: SlotRow) => void;
	onLog: (row: SlotRow) => void;
}) {
	const { colors } = usePoTheme();
	const logged = rows.filter((row) => row.meals.length > 0).length;
	return (
		<View style={styles.section}>
			<View style={styles.sectionHead}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Today's meals
				</PoText>
				<PoText variant="eyebrow11" tone="textTertiary">
					{`${logged} of ${rows.length} logged`}
				</PoText>
			</View>
			<ListCard>
				{rows.map((row, index) => {
					const recipe = row.recipeId ? recipeById(row.recipeId) : undefined;
					const time = new Date(2000, 0, 1, Math.floor(row.time / 60), row.time % 60);
					const empty = row.meals.length === 0 && !row.planned;
					return (
						<Pressable
							key={row.slot}
							accessibilityRole="button"
							onPress={() => {
								haptics.tap();
								onRow(row);
							}}
							style={({ pressed }) => [
								styles.mealRow,
								index < rows.length - 1 && {
									borderBottomWidth: 1,
									borderBottomColor: colors.borderDefault,
								},
								pressed ? { opacity: 0.7 } : null,
							]}
						>
							<MealImage photo={row.photo} recipeId={recipe?.id ?? null} size={44} radius={12} />
							<View style={styles.flex}>
								<View style={styles.mealTitle}>
									<PoText variant="row15" tone={empty ? "textSecondary" : "textPrimary"}>
										{SLOT_LABELS[row.slot]}
									</PoText>
									<PoText variant="mono13" tone="textTertiary">
										{clock(time)}
									</PoText>
								</View>
								<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
									{empty ? "Tap to log" : capitalFirst(row.title)}
								</PoText>
							</View>
							{row.planned ? (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Log ${SLOT_LABELS[row.slot]}`}
									onPress={() => {
										haptics.tap();
										onLog(row);
									}}
									style={[styles.logButton, { backgroundColor: colors.bgInverse }]}
								>
									<PoText variant="meta13" tone="textInverse">
										Log
									</PoText>
								</Pressable>
							) : row.kcal > 0 ? (
								<PoText variant="row15">
									{kcalText(row.kcal)}
									<PoText variant="meta13" tone="textTertiary">
										{" kcal"}
									</PoText>
								</PoText>
							) : null}
						</Pressable>
					);
				})}
			</ListCard>
		</View>
	);
}

const capitalFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The empty Home: pick a goal and see the targets it gives. */
export function GoalCard({
	goal,
	onGoal,
	targets,
	from,
	busy,
	onStart,
	action = "Start with these",
}: {
	goal: Goal;
	onGoal: (goal: Goal) => void;
	targets: Targets;
	from: string;
	busy: boolean;
	onStart: () => void;
	action?: string;
}) {
	const stats = [
		{ label: "Kcal", value: kcalText(targets.kcal) },
		{ label: "Protein", value: `${targets.protein} g` },
		{ label: "Water", value: `${(targets.waterMl / 1000).toFixed(1).replace(/\.0$/, "")} L` },
	];
	return (
		<Card>
			<PoText variant="eyebrow11" tone="textTertiary">
				Set your goal
			</PoText>
			<PoText variant="title18">What are you eating for?</PoText>
			<View style={styles.chips}>
				{GOALS.map((option) => (
					<FilterChip
						key={option}
						label={GOAL_LABELS[option]}
						selected={option === goal}
						onPress={() => onGoal(option)}
					/>
				))}
			</View>
			<PoText variant="meta13" tone="textSecondary">
				{from}
			</PoText>
			<View style={styles.stats}>
				{stats.map((stat) => (
					<View key={stat.label} style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{stat.label}
						</PoText>
						<PoText variant="title18">{stat.value}</PoText>
					</View>
				))}
			</View>
			<PoText variant="meta13" tone="textSecondary">
				{GOAL_ADVICE[goal]}
			</PoText>
			<PillButton label={busy ? "Saving…" : action} disabled={busy} onPress={onStart} />
		</Card>
	);
}

export function FirstMealCard() {
	return (
		<Card>
			<PoText variant="row15">Then log your first meal</PoText>
			<PoText variant="meta13" tone="textSecondary">
				No forms. Say what you ate, snap a photo or scan a barcode, and I'll work out the numbers.
			</PoText>
		</Card>
	);
}

/** The Food AI's answer, with the recipe it suggested. */
export function FoodAnswerCard({
	question,
	answer,
	recipeId,
	followUps,
	onRecipe,
	onFollowUp,
	onDone,
}: {
	question: string;
	answer: string;
	recipeId: string | null;
	followUps: readonly string[];
	onRecipe: (id: string) => void;
	onFollowUp: (question: string) => void;
	onDone: () => void;
}) {
	const { colors } = usePoTheme();
	const recipe = recipeId ? recipeById(recipeId) : undefined;
	return (
		<Card accent>
			<View style={styles.answerHead}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="eyebrow11" tone="textTertiary">
					Answer
				</PoText>
			</View>
			<PoText variant="mono13" tone="textSecondary">
				“{question}”
			</PoText>
			<PoText variant="body15">{answer}</PoText>
			{recipe ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => onRecipe(recipe.id)}
					style={[styles.recipeChip, { backgroundColor: colors.bgSubtle }]}
				>
					<MealImage recipeId={recipe.id} size={44} radius={12} />
					<View style={styles.flex}>
						<PoText variant="row15">{recipe.name}</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{`${recipe.minutes} min · ${recipe.kcal} kcal · ${recipe.protein} g protein`}
						</PoText>
					</View>
					<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
				</Pressable>
			) : null}
			{followUps.length > 0 ? (
				<View style={styles.chips}>
					{followUps.map((item) => (
						<FilterChip key={item} label={item} selected={false} onPress={() => onFollowUp(item)} />
					))}
				</View>
			) : null}
			<PillButton label="Done" variant="secondary" onPress={onDone} />
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	macros: { flexDirection: "row", gap: 14 },
	macro: { flex: 1, gap: 6 },
	weightRow: { flexDirection: "row", alignItems: "baseline", gap: 12, flexWrap: "wrap" },
	weightFoot: { flexDirection: "row", justifyContent: "space-between" },
	water: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
		paddingLeft: 12,
		paddingRight: 12,
		borderRadius: 28,
		borderWidth: 1,
	},
	drop: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	dashes: { flexDirection: "row", gap: 4, paddingTop: 6, maxWidth: 180 },
	dash: { flex: 1, height: 4, borderRadius: 2 },
	plus: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	section: { gap: 8 },
	sectionHead: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 },
	mealRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	mealTitle: { flexDirection: "row", alignItems: "baseline", gap: 8 },
	logButton: { height: 34, borderRadius: 17, paddingHorizontal: 16, justifyContent: "center" },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	stats: { flexDirection: "row", gap: 12, paddingVertical: 4 },
	answerHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	recipeChip: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 20 },
});
