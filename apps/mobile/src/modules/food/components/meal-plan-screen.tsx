import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
	EmptyCard,
	Footer,
	ListCard,
	ListRow,
	ProgressBar,
	ScreenTitle,
} from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { monthShort } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { makeGroceryList, regeneratePlan } from "../data/food-actions";
import { useFoodUi } from "../hooks/food-ui-store";
import { useFoodToday } from "../hooks/use-food";
import { eatenOn, planDayCost, planDayMacros, recipeMacros } from "../lib/food-math";
import { SLOT_LABELS } from "../lib/food-model";
import { recipeById } from "../lib/recipes";
import { foodRoutes } from "../navigation";
import { FoodScreen } from "./food-screen";
import { kcalText } from "./home-cards";
import { MealImage } from "./meal-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");

/** Meal plan: the week's days with their photos, calories and cost; tap a day for its meals. */
export function MealPlanScreen() {
	const { colors } = usePoTheme();
	const { data, today, week, weekId, plan } = useFoodToday();
	const { settings, meals } = data;
	const [open, setOpen] = useState<string | null>(today);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const first = new Date(`${weekId}T12:00:00`);

	const regenerate = () => {
		setBusy(true);
		regeneratePlan(weekId, week, settings, useFoodUi.getState().nextSeed(), plan, today)
			.then(() => haptics.success())
			.catch((error: unknown) => {
				console.error("[food] could not plan the week", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
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

	return (
		<FoodScreen action={{ icon: "Filled/Edit", label: "Recipes", onPress: foodRoutes.recipes }}>
			<ScreenTitle
				eyebrow={`Week of ${first.getDate()} ${monthShort(first)} · ${kcalText(settings.targets.kcal)} kcal a day`}
				title="Meal plan"
			/>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
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
					const tone = isToday ? "accentDefault" : share >= 0.9 ? "statusSuccess" : "statusCaution";
					const date = new Date(`${day}T12:00:00`);
					const expanded = open === day;
					return (
						<View key={day}>
							<Pressable
								accessibilityRole="button"
								accessibilityState={{ expanded }}
								onPress={() => {
									haptics.tap();
									setOpen(expanded ? null : day);
								}}
								style={[
									styles.day,
									{
										backgroundColor: colors.bgSurface,
										borderColor: isToday ? colors.accentDefault : colors.borderDefault,
									},
								]}
							>
								<PoText
									variant="mono13"
									tone={isToday ? "accentDefault" : "textSecondary"}
									style={styles.dayName}
								>
									{(WEEKDAYS[date.getDay()] ?? "").toUpperCase()}
								</PoText>
								<View style={styles.photos}>
									{planned.meals.slice(0, 3).map((meal, index) => (
										<MealImage
											key={meal.slot}
											recipeId={meal.recipeId}
											size={34}
											radius={10}
											style={index > 0 ? styles.overlap : undefined}
										/>
									))}
								</View>
								<View style={styles.flex}>
									<PoText variant="row15">
										{kcalText(shown)}
										<PoText variant="meta13" tone="textTertiary">
											{past || (isToday && eaten > 0) ? " kcal" : " planned"}
										</PoText>
									</PoText>
									<ProgressBar share={past || isToday ? share : 0} tone={tone} />
								</View>
								<PoText variant="mono13" tone="textTertiary">
									{money(planDayCost(planned))}
								</PoText>
							</Pressable>
							{expanded && planned.meals.length > 0 ? (
								<View style={styles.meals}>
									<ListCard>
										{planned.meals.map((meal, index) => {
											const recipe = recipeById(meal.recipeId);
											if (!recipe) return null;
											return (
												<ListRow
													key={meal.slot}
													leading={<MealImage recipeId={recipe.id} size={40} radius={12} />}
													title={recipe.name}
													subtitle={`${SLOT_LABELS[meal.slot]}${meal.portions === 1 ? "" : ` · ${meal.portions} servings`}`}
													value={`${kcalText(recipeMacros(recipe, meal.portions).kcal)} kcal`}
													chevron
													last={index === planned.meals.length - 1}
													onPress={() => foodRoutes.recipe(recipe.id)}
												/>
											);
										})}
									</ListCard>
								</View>
							) : null}
						</View>
					);
				})
			) : (
				<EmptyCard
					icon="Filled/Calendar"
					title="Plan this week"
					body={`Five meals a day near ${kcalText(settings.targets.kcal)} kcal and ${settings.targets.protein} g protein, from simple home recipes, with what it costs.`}
				>
					<PillButton
						label={busy ? "Planning…" : "Make a plan"}
						disabled={busy}
						onPress={regenerate}
					/>
				</EmptyCard>
			)}
			{plan ? (
				<Footer>
					<PillButton
						label={busy ? "Planning…" : "Regenerate"}
						variant="secondary"
						disabled={busy}
						style={styles.flex}
						onPress={regenerate}
					/>
					<PillButton label="Make grocery list" style={styles.flex} onPress={grocery} />
				</Footer>
			) : null}
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 6 },
	day: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
	dayName: { width: 36 },
	photos: { flexDirection: "row", width: 90 },
	overlap: { marginLeft: -6 },
	meals: { paddingTop: 8 },
});
