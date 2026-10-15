import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, MetaChip } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { planRecipe, saveRecipeState } from "../data/food-actions";
import { useFoodToday } from "../hooks/use-food";
import { nextSlot, recipeMacros } from "../lib/food-math";
import { SLOT_LABELS, SLOT_TIMES, SLOTS, type Slot } from "../lib/food-model";
import { recipeById } from "../lib/recipes";
import { remaining } from "../lib/targets";
import { foodRoutes } from "../navigation";
import { CookMode } from "./cook-mode";
import { FoodScreen } from "./food-screen";
import { Card, MACRO_TONES } from "./home-cards";
import { MealImage } from "./meal-image";
import { HeartButton } from "./recipes-screen";

/** Recipe: photo, numbers, how well it fits today, what's at home, the steps, and Cook mode. */
export function RecipeDetailScreen({ id }: { id: string }) {
	const { colors } = usePoTheme();
	const { data, eaten, now, today, weekId, plan } = useFoodToday();
	const recipe = recipeById(id);
	const [portions, setPortions] = useState(1);
	const [cooking, setCooking] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	if (!recipe) {
		return (
			<FoodScreen>
				<EmptyCard
					icon="Food"
					title="Recipe not found"
					body="It may have been renamed in an update."
				>
					<PillButton label="All recipes" onPress={foodRoutes.recipes} />
				</EmptyCard>
			</FoodScreen>
		);
	}

	const state = data.recipes.find((item) => item.id === recipe.id) ?? {
		id: recipe.id,
		saved: false,
		atHome: [],
	};
	const minutesNow = now.getHours() * 60 + now.getMinutes();
	const coming = nextSlot(minutesNow, SLOT_TIMES);
	const slot: Slot = recipe.slots.includes(coming)
		? coming
		: (recipe.slots.find((option) => SLOTS.indexOf(option) >= SLOTS.indexOf(coming)) ??
			recipe.slots[0] ??
			"dinner");
	const macros = recipeMacros(recipe, portions);
	const left = remaining(data.settings.targets, eaten);
	const covers =
		left.protein > 0 ? Math.min(100, Math.round((macros.protein / left.protein) * 100)) : 100;
	const grams = recipe.protein + recipe.carbs + recipe.fat;
	const home = new Set(state.atHome);

	const toggleHome = (index: number) => {
		haptics.select();
		const atHome = home.has(index)
			? state.atHome.filter((item) => item !== index)
			: [...state.atHome, index];
		saveRecipeState({ ...state, atHome }).catch((error: unknown) =>
			console.error("[food] could not save the recipe", error),
		);
	};

	const add = () => {
		planRecipe(plan, weekId, today, slot, recipe.id, portions)
			.then(() => {
				haptics.success();
				foodRoutes.today();
			})
			.catch((error: unknown) => {
				console.error("[food] could not plan the recipe", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<FoodScreen
			action={{
				icon: "Filled/Calendar",
				label: "Meal plan",
				onPress: foodRoutes.plan,
			}}
		>
			<MealImage recipeId={recipe.id} hero size={240} fill radius={28} />
			<View style={styles.title}>
				<View style={styles.titleRow}>
					<View style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{recipe.kind}
						</PoText>
						<PoText variant="title30" accessibilityRole="header">
							{recipe.name}
						</PoText>
					</View>
					<HeartButton
						saved={state.saved}
						onPress={() =>
							void saveRecipeState({ ...state, saved: !state.saved }).catch((error: unknown) =>
								console.error("[food] could not save the recipe", error),
							)
						}
					/>
				</View>
				<View style={styles.chips}>
					<MetaChip icon="Clock" label={`${recipe.minutes} min`} />
					<MetaChip icon="Lightning" iconTone="statusCaution" label={`${recipe.kcal} kcal`} />
					<MetaChip icon="Dumbbell" iconTone="statusDanger" label={`${recipe.protein} g protein`} />
					<MetaChip icon="Food" label={`Serves ${recipe.serves}`} />
				</View>
			</View>

			<View style={styles.macroBlock}>
				<View style={styles.macroBar}>
					{(["protein", "carbs", "fat"] as const).map((key) => (
						<View
							key={key}
							style={[
								styles.macroPart,
								{ flex: recipe[key] / grams, backgroundColor: colors[MACRO_TONES[key]] },
							]}
						/>
					))}
				</View>
				<View style={styles.legend}>
					{(["protein", "carbs", "fat"] as const).map((key) => (
						<View key={key} style={styles.legendItem}>
							<View style={[styles.dot, { backgroundColor: colors[MACRO_TONES[key]] }]} />
							<PoText variant="meta13" tone="textSecondary">
								{`${key.charAt(0).toUpperCase()}${key.slice(1)} ${recipe[key]} g`}
							</PoText>
						</View>
					))}
				</View>
			</View>

			<View
				style={[
					styles.fit,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={[styles.fitIcon, { backgroundColor: colors.accentSubtle }]}>
					<Icon name="Filled/Sparkle" size={16} color={colors.accentDefault} />
				</View>
				<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
					{left.protein > 0
						? `${macros.kcal <= left.kcal + 150 ? "Fits your plan." : "A big one for today."} Covers `
						: "Protein's done for today. "}
					{left.protein > 0 ? <PoText variant="meta13">{`${covers}%`}</PoText> : null}
					{left.protein > 0 ? " of today's protein left." : ""}
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

			<View style={styles.sectionHead}>
				<PoText variant="title18" style={styles.flex}>
					Ingredients
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{`${home.size} of ${recipe.ingredients.length} at home`}
				</PoText>
			</View>
			<Card>
				{recipe.ingredients.map((item, index) => {
					const have = home.has(index);
					return (
						<Pressable
							key={item.name}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: have }}
							onPress={() => toggleHome(index)}
							style={styles.ingredient}
						>
							<Checkbox checked={have} />
							<PoText
								variant="row15"
								tone={have ? "textSecondary" : "textPrimary"}
								style={styles.flex}
							>
								{item.name}
							</PoText>
							<PoText variant="mono13" tone="textTertiary">
								{item.amount}
							</PoText>
						</Pressable>
					);
				})}
			</Card>

			<PoText variant="title18" style={styles.stepsTitle}>
				Steps
			</PoText>
			{recipe.steps.map((step, index) => (
				<View key={step.text} style={styles.step}>
					<View style={[styles.number, { backgroundColor: colors.bgSurface }]}>
						<PoText variant="meta13" tone="textSecondary">
							{index + 1}
						</PoText>
					</View>
					<View style={styles.stepText}>
						<PoText variant="body15">{step.text}</PoText>
						{step.minutes ? (
							<View style={[styles.time, { backgroundColor: colors.bgSurface }]}>
								<Icon name="Clock" size={12} color={colors.textSecondary} />
								<PoText variant="mono13" tone="textSecondary">
									{`${step.minutes} min`}
								</PoText>
							</View>
						) : null}
					</View>
				</View>
			))}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Cook mode"
					variant="secondary"
					style={styles.flex}
					onPress={() => setCooking(true)}
				/>
				<PillButton
					label={`Add to ${SLOT_LABELS[slot].toLowerCase()}`}
					style={styles.flex}
					onPress={add}
				/>
			</Footer>
			<CookMode recipe={cooking ? recipe : null} onClose={() => setCooking(false)} />
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	title: { gap: 12, paddingHorizontal: 4 },
	titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	macroBlock: { gap: 8, paddingHorizontal: 4 },
	macroBar: { flexDirection: "row", gap: 2, height: 6, borderRadius: 3, overflow: "hidden" },
	macroPart: { height: 6 },
	legend: { flexDirection: "row", justifyContent: "space-between" },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	fit: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 8,
		paddingLeft: 8,
		paddingRight: 8,
		borderRadius: 28,
		borderWidth: 1,
	},
	fitIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		height: 36,
		paddingHorizontal: 12,
		borderRadius: 18,
	},
	sectionHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingTop: 4 },
	ingredient: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	stepsTitle: { paddingHorizontal: 4, paddingTop: 4 },
	step: { flexDirection: "row", gap: 12, paddingHorizontal: 4 },
	number: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	stepText: { flex: 1, gap: 8 },
	time: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
});
