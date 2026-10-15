import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey, monthShort } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { planRecipe } from "../data/food-actions";
import { useFoodToday } from "../hooks/use-food";
import { type FoodNote, foodNotes, weekDays, weekRecap } from "../lib/food-math";
import { GOAL_LABELS } from "../lib/food-model";
import { foodRoutes } from "../navigation";
import { Card, kcalText } from "./home-cards";
import { FoodScreen } from "./food-screen";

type Range = "week" | "last" | "month";

const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");

function rangeDays(range: Range, now: Date): string[] {
	if (range === "month") {
		return Array.from({ length: 30 }, (_, step) => dayKey(addDays(now, step - 29)));
	}
	const week = weekDays(range === "last" ? addDays(now, -7) : now);
	const today = dayKey(now);
	return week.filter((day) => day <= today);
}

const short = (day: string) => {
	const date = new Date(`${day}T12:00:00`);
	return { date: date.getDate(), month: monthShort(date) };
};

function rangeLabel(days: readonly string[]): string {
	const first = days[0];
	const last = days.at(-1);
	if (!first || !last) return "";
	const a = short(first);
	const b = short(last);
	return a.month === b.month
		? `${a.date} to ${b.date} ${b.month}`
		: `${a.date} ${a.month} to ${b.date} ${b.month}`;
}

/** Food Insights: the week in one sentence, three numbers, and what's worth changing. */
export function FoodInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now, today, weekId, plan } = useFoodToday();
	const [range, setRange] = useState<Range>("week");
	const [hidden, setHidden] = useState<string[]>([]);
	const [notice, setNotice] = useState<string | null>(null);
	const { settings } = data;

	const view = useMemo(() => {
		const days = rangeDays(range, now);
		const recap = weekRecap(data.meals, data.weighIns, settings, days);
		const notes = foodNotes({ meals: data.meals, water: data.water, settings, today, days, recap });
		return { days, recap, notes };
	}, [range, now, data, settings, today]);
	const { recap, days } = view;
	const notes = view.notes.filter((note) => !hidden.includes(note.kind));
	const hide = (note: FoodNote) => setHidden((list) => [...list, note.kind]);

	const addToPlan = (slot: "dinner" | "breakfast", recipeId: string, day = today) =>
		planRecipe(plan, weekId, day, slot, recipeId, 1)
			.then(() => {
				haptics.success();
				setNotice("Added to your meal plan.");
			})
			.catch((error: unknown) => {
				console.error("[food] could not plan the recipe", error);
				setNotice("Couldn't save on this phone. Try again.");
			});

	const goal = GOAL_LABELS[settings.goal].toLowerCase();
	const proteinTarget = `${recap.proteinDays} of ${recap.days}`;

	return (
		<FoodScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "Meal plan", onPress: foodRoutes.plan }}
		>
			<View style={styles.ranges}>
				<FilterChip
					label="This week"
					selected={range === "week"}
					onPress={() => setRange("week")}
				/>
				<FilterChip
					label="Last week"
					selected={range === "last"}
					onPress={() => setRange("last")}
				/>
				<FilterChip label="Month" selected={range === "month"} onPress={() => setRange("month")} />
			</View>

			{recap.days === 0 ? (
				<EmptyCard
					icon="Filled/Chart"
					title="Nothing logged here yet"
					body="Log a few meals and this fills in: your average, protein days and how your weight moves."
				>
					<PillButton label="Log a meal" onPress={foodRoutes.log} />
				</EmptyCard>
			) : (
				<>
					<View style={styles.recap}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{`${range === "month" ? "Monthly" : "Weekly"} recap · ${rangeLabel(days)}`}
							</PoText>
						</View>
						<PoText variant="title18">
							{"You averaged "}
							<PoText variant="title18">{`${kcalText(recap.avgKcal)} kcal`}</PoText>
							<PoText variant="title18" tone="textSecondary">
								{recap.gap < -50
									? `, ${kcalText(-recap.gap)} short of the ${goal}. `
									: recap.gap > 50
										? `, ${kcalText(recap.gap)} over the ${goal}. `
										: `, right on the ${goal}. `}
								{"Protein hit target on "}
							</PoText>
							{proteinTarget}
							<PoText variant="title18" tone="textSecondary">
								{recap.days === 1 ? " day" : " days"}
								{recap.weightChange === null
									? "."
									: `, and you're ${recap.weightChange >= 0 ? "up" : "down"} `}
							</PoText>
							{recap.weightChange === null ? null : (
								<PoText variant="title18" tone="textSuccess">
									{`${Math.abs(recap.weightChange).toFixed(1)} kg.`}
								</PoText>
							)}
						</PoText>
					</View>

					<View style={styles.stats}>
						<Stat
							label="Avg kcal"
							value={kcalText(recap.avgKcal)}
							foot={
								recap.gap === 0
									? "on target"
									: `${recap.gap < 0 ? "▼" : "▲"} ${kcalText(Math.abs(recap.gap))}`
							}
							footTone={Math.abs(recap.gap) <= 100 ? "textSuccess" : "textDanger"}
						/>
						<Stat
							label="Protein"
							value={`${recap.proteinDays}/${recap.days}`}
							foot="days"
							footTone="textTertiary"
						/>
						<Stat
							label="Weight"
							value={data.weighIns.at(-1)?.kg.toFixed(1) ?? "–"}
							foot={
								recap.weightChange === null
									? "weigh in"
									: `${recap.weightChange >= 0 ? "▲" : "▼"} ${Math.abs(recap.weightChange).toFixed(1)}`
							}
							footTone={recap.weightChange === null ? "textTertiary" : "textSuccess"}
						/>
					</View>
				</>
			)}

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.notice}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => (
				<NoteCard
					key={note.kind}
					note={note}
					onPrimary={() => {
						if (note.kind === "dinner") void addToPlan("dinner", note.recipe.id);
						else if (note.kind === "breakfast")
							void addToPlan("breakfast", "lassi-boiled-eggs", dayKey(addDays(now, 1)));
						else if (note.kind === "protein-price") foodRoutes.plan();
						else foodRoutes.today();
						hide(note);
					}}
					onSecondary={() => {
						if (note.kind === "dinner") foodRoutes.recipes();
						else hide(note);
					}}
				/>
			))}
		</FoodScreen>
	);
}

function Stat({
	label,
	value,
	foot,
	footTone,
}: {
	label: string;
	value: string;
	foot: string;
	footTone: "textSuccess" | "textDanger" | "textTertiary";
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.stat,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<PoText variant="title18">{value}</PoText>
			<PoText variant="mono13" tone={footTone}>
				{foot}
			</PoText>
		</View>
	);
}

function noteText(note: FoodNote) {
	switch (note.kind) {
		case "dinner":
			return {
				title: "Dinner idea",
				body: `You need ${note.protein} g more protein today. ${note.recipe.name} with raita gets you there for about ${kcalText(note.kcal)} kcal.`,
				primary: "Use for dinner",
				secondary: "Swap",
			};
		case "breakfast":
			return {
				title: "Breakfast is light",
				body: `Breakfast averages ${note.protein} g protein. Two boiled eggs or a glass of lassi adds about 12 g for around Rs 70.`,
				primary: "Add to plan",
				secondary: "Later",
			};
		case "protein-price":
			return {
				title: "Cheapest protein",
				body: `${note.cheap.map((item) => item.name).join(" and ")} cost about ${money(note.cheap[0]?.per10g ?? 0)} per 10 g of protein, ${note.dear.name.toLowerCase()} about ${money(note.dear.per10g)}. Lean on them when money is tight.`,
				primary: "Open meal plan",
				secondary: "Got it",
			};
		case "water":
			return {
				title: "Water is low",
				body: `You've averaged ${(note.avgMl / 1000).toFixed(1)} L a day against ${(note.targetMl / 1000).toFixed(1)} L. A glass with each meal closes most of the gap.`,
				primary: "Log a glass",
				secondary: "Skip",
			};
	}
}

function NoteCard({
	note,
	onPrimary,
	onSecondary,
}: {
	note: FoodNote;
	onPrimary: () => void;
	onSecondary: () => void;
}) {
	const { colors } = usePoTheme();
	const text = noteText(note);
	return (
		<Card>
			<View style={styles.eyebrow}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="eyebrow11" tone="textTertiary">
					{text.title}
				</PoText>
			</View>
			<PoText variant="body15" tone="textSecondary">
				{text.body}
			</PoText>
			<View style={styles.actions}>
				<PillButton label={text.primary} style={styles.flex} onPress={onPrimary} />
				<PillButton label={text.secondary} variant="secondary" onPress={onSecondary} />
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { flexDirection: "row", gap: 8 },
	recap: { gap: 8, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 24, borderWidth: 1 },
	notice: { paddingHorizontal: 6 },
	actions: { flexDirection: "row", gap: 8 },
});
