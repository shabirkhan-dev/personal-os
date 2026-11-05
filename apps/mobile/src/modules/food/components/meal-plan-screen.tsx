import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { monthShort } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { toTextStyle, usePoTheme } from "@/theme";
import {
	applyPlanDays,
	clearWeek,
	emptyPlan,
	fillPlan,
	makeGroceryList,
	regeneratePlan,
	repeatDay,
	setPlanSlot,
} from "../data/food-actions";
import { useFoodUi } from "../hooks/food-ui-store";
import { useFoodToday } from "../hooks/use-food";
import { eatenOn, planDayCost, planDayMacros, recipeMacros } from "../lib/food-math";
import { GOAL_LABELS, type PlannedMeal, SLOT_LABELS, SLOTS, type Slot } from "../lib/food-model";
import { allRecipes, recipeById } from "../lib/recipes";
import { foodRoutes } from "../navigation";
import { foodAiMessage, useFoodAi } from "../services/food-ai";
import { FoodScreen } from "./food-screen";
import { kcalText } from "./home-cards";
import { MealImage } from "./meal-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const inputStyle = toTextStyle(textStyles.body15);
const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");

const seed = () => useFoodUi.getState().nextSeed();

type Picking = { day: string; slot: Slot; current: PlannedMeal | null };

/**
 * Meal plan: the week's days with their photos, calories and cost. Open a day to fill each meal
 * yourself, or let the phone fill the gaps, or have AI plan the week from what you ask for.
 */
export function MealPlanScreen() {
	const { colors } = usePoTheme();
	const { data, today, week, weekId, plan } = useFoodToday();
	const { settings, meals } = data;
	const ai = useFoodAi();
	const [open, setOpen] = useState<string | null>(today);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [picking, setPicking] = useState<Picking | null>(null);
	const [options, setOptions] = useState(false);
	const [wishes, setWishes] = useState("");
	const first = new Date(`${weekId}T12:00:00`);

	const run = (work: () => Promise<unknown>, done?: string) => {
		setBusy(true);
		setNotice(null);
		work()
			.then(() => {
				haptics.success();
				if (done) setNotice(done);
			})
			.catch((error: unknown) => {
				console.error("[food] could not plan the week", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
			.finally(() => setBusy(false));
	};

	const autoPlan = () => run(() => regeneratePlan(weekId, week, settings, seed(), plan, today));
	const fill = () =>
		run(
			() => fillPlan(plan, weekId, week, settings, seed(), today),
			"Empty meals filled. Yours stayed.",
		);
	const blank = () =>
		run(() => emptyPlan(weekId, week), "An empty week. Open a day and add meals.");

	const planWithAi = () => {
		setOptions(false);
		setBusy(true);
		setNotice(null);
		const days = week.filter((day) => day >= today);
		ai.planWeek({
			goal: GOAL_LABELS[settings.goal],
			targets: settings.targets,
			wishes,
			days,
			recipes: allRecipes()
				.filter((recipe) => recipe.kcal > 0)
				.map((recipe) => ({
					id: recipe.id,
					name: recipe.name,
					slots: recipe.slots,
					kcal: recipe.kcal,
					protein: recipe.protein,
					cost: recipe.cost,
				})),
		})
			.then((result) =>
				applyPlanDays(plan, weekId, week, result.days, today).then(() => {
					haptics.success();
					setNotice(result.note || "Planned with AI. Change any meal you like.");
				}),
			)
			.catch((error: unknown) => setNotice(foodAiMessage(error)))
			.finally(() => setBusy(false));
	};

	const grocery = () => {
		if (!plan) return;
		const previous = data.groceries.find((list) => list.id === plan.id) ?? null;
		makeGroceryList(plan, today, previous)
			.then(() => foodRoutes.grocery())
			.catch((error: unknown) => {
				console.error("[food] could not make the list", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	const choose = (recipeId: string | null, portions: number) => {
		if (!picking) return;
		const { day, slot } = picking;
		setPicking(null);
		run(() => setPlanSlot(plan, weekId, week, day, slot, recipeId, portions));
	};

	const hasMeals = plan?.days.some((day) => day.meals.length > 0) ?? false;

	return (
		<FoodScreen action={{ icon: "Filled/Edit", label: "Recipes", onPress: foodRoutes.recipes }}>
			<ScreenTitle
				eyebrow={`Week of ${first.getDate()} ${monthShort(first)} · ${kcalText(settings.targets.kcal)} kcal a day`}
				title="Meal plan"
			/>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			{plan ? (
				week.map((day) => {
					const planned = plan.days.find((item) => item.day === day) ?? { day, meals: [] };
					const target = planDayMacros(planned).kcal;
					const eaten = eatenOn(meals, day).kcal;
					const past = day < today;
					const isToday = day === today;
					const shown = past || isToday ? eaten || (past ? target : 0) : target;
					const share = settings.targets.kcal > 0 ? shown / settings.targets.kcal : 0;
					const plannedShare = settings.targets.kcal > 0 ? target / settings.targets.kcal : 0;
					const tone = isToday
						? "accentDefault"
						: plannedShare >= 0.9
							? "statusSuccess"
							: "statusCaution";
					const date = new Date(`${day}T12:00:00`);
					const expanded = open === day;
					return (
						<View key={day} style={styles.dayBlock}>
							<Pressable
								accessibilityRole="button"
								accessibilityState={{ expanded }}
								onPress={() => {
									haptics.tap();
									setOpen(expanded ? null : day);
								}}
								style={[
									styles.day,
									{ backgroundColor: isToday ? colors.accentSubtle : colors.bgSurface },
								]}
							>
								<View style={styles.dayName}>
									<PoText variant="mono13" tone={isToday ? "accentDefault" : "textSecondary"}>
										{(WEEKDAYS[date.getDay()] ?? "").toUpperCase()}
									</PoText>
									<PoText variant="meta13" tone="textTertiary">
										{String(date.getDate())}
									</PoText>
								</View>
								<View style={styles.photos}>
									{planned.meals.length === 0 ? (
										<PoText variant="meta13" tone="textTertiary">
											Nothing yet
										</PoText>
									) : (
										planned.meals
											.slice(0, 3)
											.map((meal, index) => (
												<MealImage
													key={meal.slot}
													recipeId={meal.recipeId}
													size={34}
													radius={10}
													style={index > 0 ? styles.overlap : undefined}
												/>
											))
									)}
								</View>
								<View style={styles.flex}>
									<PoText variant="row15">
										{kcalText(shown)}
										<PoText variant="meta13" tone="textTertiary">
											{past || (isToday && eaten > 0) ? " kcal" : " planned"}
										</PoText>
									</PoText>
									<ProgressBar share={past || isToday ? share : plannedShare} tone={tone} />
								</View>
								<PoText variant="mono13" tone="textTertiary">
									{money(planDayCost(planned))}
								</PoText>
							</Pressable>
							{expanded ? (
								<View style={[styles.slots, { backgroundColor: colors.bgSurface }]}>
									{SLOTS.map((slot) => {
										const meal = planned.meals.find((item) => item.slot === slot) ?? null;
										const recipe = meal ? recipeById(meal.recipeId) : undefined;
										return (
											<Pressable
												key={slot}
												accessibilityRole="button"
												accessibilityLabel={
													recipe
														? `${SLOT_LABELS[slot]}: ${recipe.name}. Change`
														: `Add ${SLOT_LABELS[slot].toLowerCase()}`
												}
												disabled={past}
												onPress={() => {
													haptics.tap();
													setPicking({ day, slot, current: meal });
												}}
												style={({ pressed }) => [styles.slotRow, pressed ? { opacity: 0.7 } : null]}
											>
												{recipe ? (
													<MealImage recipeId={recipe.id} size={44} radius={12} />
												) : (
													<View style={[styles.slotEmpty, { borderColor: colors.borderStrong }]}>
														<Icon name="Line/Plus" size={16} color={colors.textTertiary} />
													</View>
												)}
												<View style={styles.flex}>
													<PoText variant="meta13" tone="textTertiary">
														{SLOT_LABELS[slot]}
													</PoText>
													<PoText
														variant="row15"
														tone={recipe ? "textPrimary" : "textSecondary"}
														numberOfLines={1}
													>
														{recipe ? recipe.name : past ? "–" : "Add a meal"}
													</PoText>
												</View>
												{recipe && meal ? (
													<PoText variant="meta13" tone="textTertiary">
														{`${meal.portions === 1 ? "" : `×${meal.portions} · `}${kcalText(recipeMacros(recipe, meal.portions).kcal)} kcal`}
													</PoText>
												) : null}
											</Pressable>
										);
									})}
									{!past &&
									planned.meals.length > 0 &&
									week.some(
										(other) =>
											other > day &&
											(plan.days.find((item) => item.day === other)?.meals.length ?? 0) === 0,
									) ? (
										<Pressable
											accessibilityRole="button"
											onPress={() =>
												run(
													() => repeatDay(plan, weekId, day),
													"Copied to the empty days after it.",
												)
											}
											style={styles.repeat}
										>
											<PoText variant="meta13" tone="textLink">
												Repeat this day on the empty days after it
											</PoText>
										</Pressable>
									) : null}
								</View>
							) : null}
						</View>
					);
				})
			) : (
				<EmptyCard
					icon="Filled/Calendar"
					title="Plan this week"
					body={`Five meals a day near ${kcalText(settings.targets.kcal)} kcal and ${settings.targets.protein} g protein, from home recipes and your own, with what it costs.`}
				>
					<PillButton
						label={busy ? "Planning…" : "Plan it for me"}
						disabled={busy}
						onPress={autoPlan}
					/>
					{ai.available ? (
						<PillButton
							label="Plan with AI"
							variant="secondary"
							disabled={busy}
							onPress={() => setOptions(true)}
						/>
					) : null}
					<PillButton
						label="I'll build it myself"
						variant="secondary"
						disabled={busy}
						onPress={blank}
					/>
				</EmptyCard>
			)}
			{plan ? (
				<Footer>
					<PillButton
						label={busy ? "Planning…" : "Plan options"}
						variant="secondary"
						disabled={busy}
						style={styles.flex}
						onPress={() => setOptions(true)}
					/>
					<PillButton
						label="Make grocery list"
						disabled={!hasMeals}
						style={styles.flex}
						onPress={grocery}
					/>
				</Footer>
			) : null}

			<Sheet visible={options} title="Plan the week" onClose={() => setOptions(false)}>
				{ai.available ? (
					<>
						<TextField
							label="Ask AI for a week (optional wishes)"
							value={wishes}
							onChangeText={setWishes}
							placeholder="More chicken, no fish, cheap on weekdays"
						/>
						<PillButton label="Plan with AI" onPress={planWithAi} />
					</>
				) : (
					<PoText variant="meta13" tone="textSecondary">
						Sign in to have AI plan the week from what you ask for.
					</PoText>
				)}
				{plan ? (
					<>
						<PillButton
							label="Fill the empty meals"
							variant="secondary"
							onPress={() => {
								setOptions(false);
								fill();
							}}
						/>
						<PillButton
							label="Start over with a new plan"
							variant="secondary"
							onPress={() => {
								setOptions(false);
								autoPlan();
							}}
						/>
						<PillButton
							label="Clear the week"
							variant="secondary"
							onPress={() =>
								showDialog("Clear the week?", "Days already past keep what you ate.", [
									{ text: "Cancel", style: "cancel" },
									{
										text: "Clear",
										style: "destructive",
										onPress: () => {
											setOptions(false);
											run(
												() => clearWeek(plan, weekId, week, today),
												"Cleared. Open a day to add meals.",
											);
										},
									},
								])
							}
						/>
					</>
				) : null}
			</Sheet>

			<RecipePicker picking={picking} onClose={() => setPicking(null)} onChoose={choose} />
		</FoodScreen>
	);
}

/** Pick a recipe for one meal: the ones that suit it first, a search, and servings. */
function RecipePicker({
	picking,
	onClose,
	onChoose,
}: {
	picking: Picking | null;
	onClose: () => void;
	onChoose: (recipeId: string | null, portions: number) => void;
}) {
	const { colors } = usePoTheme();
	const [query, setQuery] = useState("");
	const [portions, setPortions] = useState(1);
	const slot = picking?.slot ?? "dinner";
	const words = query.trim().toLowerCase();
	const recipes = allRecipes()
		.filter((recipe) => !words || recipe.name.toLowerCase().includes(words))
		.sort((a, b) => Number(b.slots.includes(slot)) - Number(a.slots.includes(slot)));
	const current = picking?.current ? recipeById(picking.current.recipeId) : undefined;

	return (
		<Sheet
			visible={picking !== null}
			title={
				picking
					? `${SLOT_LABELS[slot]} · ${WEEKDAYS[new Date(`${picking.day}T12:00:00`).getDay()]}`
					: ""
			}
			onClose={() => {
				setQuery("");
				onClose();
			}}
		>
			<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Search" size={16} color={colors.textSecondary} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search recipes"
					placeholderTextColor={colors.textTertiary}
					accessibilityLabel="Search recipes"
					style={[inputStyle, styles.flex, { color: colors.textPrimary }]}
				/>
			</View>
			<View style={styles.portions}>
				<PoText variant="row15" style={styles.flex}>
					Servings
				</PoText>
				<View style={[styles.stepper, { backgroundColor: colors.bgSubtle }]}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Fewer servings"
						hitSlop={8}
						onPress={() => setPortions((value) => Math.max(0.5, value - 0.5))}
					>
						<Icon name="Minus" size={16} color={colors.textPrimary} />
					</Pressable>
					<PoText variant="row15">{portions}</PoText>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="More servings"
						hitSlop={8}
						onPress={() => setPortions((value) => Math.min(4, value + 0.5))}
					>
						<Icon name="Line/Plus" size={16} color={colors.textPrimary} />
					</Pressable>
				</View>
			</View>
			{current ? (
				<View style={styles.currentRow}>
					<PillButton
						label="Open recipe"
						variant="secondary"
						style={styles.flex}
						onPress={() => {
							onClose();
							foodRoutes.recipe(current.id);
						}}
					/>
					<PillButton
						label="Remove"
						variant="secondary"
						style={styles.flex}
						onPress={() => onChoose(null, 1)}
					/>
				</View>
			) : null}
			{recipes.slice(0, 40).map((recipe) => (
				<Pressable
					key={recipe.id}
					accessibilityRole="button"
					onPress={() => {
						haptics.select();
						setQuery("");
						onChoose(recipe.id, portions);
					}}
					style={({ pressed }) => [
						styles.pick,
						pressed ? { backgroundColor: colors.bgHover } : null,
					]}
				>
					<MealImage recipeId={recipe.id} size={48} radius={12} />
					<View style={styles.flex}>
						<PoText variant="row15" numberOfLines={1}>
							{recipe.name}
						</PoText>
						<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
							{[
								recipe.mine ? "Yours" : "",
								recipe.kcal ? `${kcalText(recipe.kcal * portions)} kcal` : "",
								recipe.protein ? `${Math.round(recipe.protein * portions)} g protein` : "",
								recipe.slots.includes(slot) ? "" : "other meal",
							]
								.filter(Boolean)
								.join(" · ")}
						</PoText>
					</View>
					{picking?.current?.recipeId === recipe.id ? (
						<Icon name="Line/Check" size={16} color={colors.accentDefault} />
					) : null}
				</Pressable>
			))}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 8, minWidth: 0 },
	pad: { paddingHorizontal: 8 },
	dayBlock: { gap: 8 },
	day: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
	},
	dayName: { width: 36, alignItems: "flex-start" },
	photos: { flexDirection: "row", width: 90, alignItems: "center" },
	overlap: { marginLeft: -6 },
	slots: { gap: 4, padding: 12, borderRadius: 20 },
	slotRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	slotEmpty: {
		width: 44,
		height: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	repeat: { alignItems: "center", paddingTop: 8 },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingHorizontal: 16,
		borderRadius: 24,
	},
	portions: { flexDirection: "row", alignItems: "center", gap: 12 },
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		height: 36,
		paddingHorizontal: 12,
		borderRadius: 18,
	},
	currentRow: { flexDirection: "row", gap: 8 },
	pick: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderRadius: 14,
	},
});
