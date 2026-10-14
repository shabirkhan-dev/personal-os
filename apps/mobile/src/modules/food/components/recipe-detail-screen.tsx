import type { ColorTokens } from "@personal-os/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { HeaderButton } from "@/components/ui/header-button";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useFoodDay } from "../hooks/use-food-day";
import { fitsCalories, macroSplit, proteinCoverage } from "../lib/match";
import { formatKcal, type Macros, type Meal, slotForTime, slotLabel } from "../lib/meals";
import { type Recipe, recipeById } from "../lib/recipes";
import { foodActions, useFoodStore } from "../store/food-store";
import { FavouriteButton } from "./favourite-button";
import { LogMealSheet, type MealDraft, nextDraftKey } from "./log-meal-sheet";
import { RecipeArt } from "./recipe-art";

const MAX_PORTIONS = 6;
const EMPTY: number[] = [];

function MetaChip({ icon, label }: { icon: IconName; label: string }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.chip, { backgroundColor: colors.bgSurface }]}>
			<Icon name={icon} size={14} color={colors.textSecondary} />
			<PoText variant="meta13">{label}</PoText>
		</View>
	);
}

function MacroSplit({ recipe }: { recipe: Recipe }) {
	const { colors } = usePoTheme();
	const split = macroSplit(recipe);
	const items: { label: string; grams: number; share: number; tone: keyof ColorTokens }[] = [
		{ label: "Protein", grams: recipe.protein, share: split.protein, tone: "statusDanger" },
		{ label: "Carbs", grams: recipe.carbs, share: split.carbs, tone: "statusCaution" },
		{ label: "Fat", grams: recipe.fat, share: split.fat, tone: "statusViolet" },
	];
	return (
		<View style={styles.macros}>
			<View style={[styles.split, { backgroundColor: colors.bgSubtle }]}>
				{items.map((item) => (
					<View key={item.label} style={{ flex: item.share, backgroundColor: colors[item.tone] }} />
				))}
			</View>
			<View style={styles.legend}>
				{items.map((item) => (
					<View key={item.label} style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: colors[item.tone] }]} />
						<PoText variant="meta13" tone="textSecondary">
							{item.label} {item.grams} g
						</PoText>
					</View>
				))}
			</View>
		</View>
	);
}

function fitText(recipe: Recipe, left: Macros, portions: number) {
	const kcal = recipe.kcal * portions;
	if (!fitsCalories(recipe, left, portions)) {
		return {
			lead: `${formatKcal(kcal)} kcal is more than the `,
			strong: `${formatKcal(left.kcal)} kcal`,
			tail: " you have left today.",
		};
	}
	if (left.protein <= 0) {
		return { lead: "Fits your plan. ", strong: "Protein is covered", tail: " for today." };
	}
	return {
		lead: "Fits your plan. Covers ",
		strong: `${proteinCoverage(recipe, left, portions)}% of today's protein`,
		tail: " left.",
	};
}

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
	const { colors } = usePoTheme();
	const step = (delta: number) => {
		const next = Math.min(MAX_PORTIONS, Math.max(1, value + delta));
		if (next !== value) {
			haptics.select();
			onChange(next);
		}
	};
	return (
		<View
			style={[styles.stepper, { backgroundColor: colors.bgSubtle }]}
			accessibilityLabel={`${value} ${value === 1 ? "serving" : "servings"}`}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="One serving less"
				disabled={value <= 1}
				onPress={() => step(-1)}
				style={styles.stepButton}
			>
				<Icon
					name="Minus"
					size={14}
					color={value <= 1 ? colors.textTertiary : colors.textPrimary}
				/>
			</Pressable>
			<PoText variant="row15">{value}</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="One serving more"
				disabled={value >= MAX_PORTIONS}
				onPress={() => step(1)}
				style={styles.stepButton}
			>
				<Icon
					name="Filled/Plus"
					size={14}
					color={value >= MAX_PORTIONS ? colors.textTertiary : colors.textPrimary}
				/>
			</Pressable>
		</View>
	);
}

function Ingredients({ recipe }: { recipe: Recipe }) {
	const { colors } = usePoTheme();
	const have = useFoodStore((state) => state.data.pantry[recipe.id] ?? EMPTY);
	return (
		<>
			<View style={styles.sectionHead}>
				<PoText variant="title18" accessibilityRole="header">
					Ingredients
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{have.length} of {recipe.ingredients.length} at home
				</PoText>
			</View>
			<View style={[styles.list, { backgroundColor: colors.bgSurface }]}>
				{recipe.ingredients.map((item, index) => {
					const checked = have.includes(index);
					return (
						<Pressable
							key={item.name}
							accessibilityRole="checkbox"
							accessibilityState={{ checked }}
							accessibilityLabel={`${item.name}, ${item.amount}`}
							onPress={() => {
								haptics.select();
								foodActions.toggleIngredient(recipe.id, index);
							}}
							style={[
								styles.ingredient,
								index < recipe.ingredients.length - 1
									? { borderBottomWidth: 1, borderColor: colors.borderDefault }
									: null,
							]}
						>
							<Checkbox checked={checked} />
							<PoText
								variant="row15"
								tone={checked ? "textSecondary" : "textPrimary"}
								style={styles.grow}
							>
								{item.name}
							</PoText>
							<PoText variant="mono13" tone="textSecondary">
								{item.amount}
							</PoText>
						</Pressable>
					);
				})}
			</View>
		</>
	);
}

function TimerChip({ minutes }: { minutes: number }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.timer, { backgroundColor: colors.bgSurface }]}>
			<Icon name="Clock" size={14} color={colors.textSecondary} />
			<PoText variant="mono13" tone="textSecondary">
				{minutes} min
			</PoText>
		</View>
	);
}

function Steps({ recipe }: { recipe: Recipe }) {
	const { colors } = usePoTheme();
	return (
		<>
			<PoText variant="title18" accessibilityRole="header">
				Steps
			</PoText>
			<View style={styles.steps}>
				{recipe.steps.map((step, index) => (
					<View key={step.text} style={styles.step}>
						<View style={[styles.stepNumber, { backgroundColor: colors.bgSubtle }]}>
							<PoText variant="meta13">{index + 1}</PoText>
						</View>
						<View style={styles.stepText}>
							<PoText variant="body15">{step.text}</PoText>
							{step.minutes ? <TimerChip minutes={step.minutes} /> : null}
						</View>
					</View>
				))}
			</View>
		</>
	);
}

function CookMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
	const [index, setIndex] = useState(0);
	const step = recipe.steps[index];
	const last = index >= recipe.steps.length - 1;
	return (
		<Sheet
			visible
			title={`Step ${index + 1} of ${recipe.steps.length}`}
			onClose={onClose}
			action={{
				label: last ? "Done" : "Next step",
				onPress: () => {
					haptics.tap();
					if (last) onClose();
					else setIndex(index + 1);
				},
			}}
		>
			<PoText variant="title30">{step?.text ?? ""}</PoText>
			{step?.minutes ? <TimerChip minutes={step.minutes} /> : null}
			{index > 0 ? (
				<PillButton variant="ghost" label="Previous step" onPress={() => setIndex(index - 1)} />
			) : null}
		</Sheet>
	);
}

function NotFound() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	return (
		<View
			style={[
				styles.screen,
				styles.notFound,
				{ backgroundColor: colors.bgApp, paddingTop: insets.top + 12 },
			]}
		>
			<HeaderButton accessibilityLabel="Back" onPress={() => router.back()} />
			<PoText variant="title18">Recipe not found</PoText>
			<PoText variant="meta13" tone="textSecondary">
				It may have been removed in an update.
			</PoText>
		</View>
	);
}

/** Food · Recipe detail (Figma 182:1270). */
export function RecipeDetailScreen({ id }: { id: string }) {
	const recipe = recipeById(id);
	return recipe ? <RecipeDetail recipe={recipe} /> : <NotFound />;
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const day = useFoodDay();
	const [portions, setPortions] = useState(1);
	const [cooking, setCooking] = useState(false);
	const [draft, setDraft] = useState<{ key: number; value: MealDraft } | null>(null);
	const [logged, setLogged] = useState<Meal | null>(null);

	const fit = fitText(recipe, day.left, portions);
	const timeSlot = slotForTime(day.now);
	const slot = recipe.slots.includes(timeSlot) ? timeSlot : (recipe.slots[0] ?? timeSlot);

	const logThis = () =>
		setDraft({
			key: nextDraftKey(),
			value: {
				slot,
				name: portions > 1 ? `${recipe.name} ×${portions}` : recipe.name,
				kcal: recipe.kcal * portions,
				protein: recipe.protein * portions,
				carbs: recipe.carbs * portions,
				fat: recipe.fat * portions,
				recipeId: recipe.id,
			},
		});

	return (
		<View style={[styles.screen, { backgroundColor: colors.bgApp }]}>
			<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
				<View>
					<RecipeArt recipe={recipe} height={320} radius={0} glyph={72} />
					<View style={[styles.top, { top: insets.top + 12 }]}>
						<HeaderButton accessibilityLabel="Back" onPress={() => router.back()} />
						<FavouriteButton recipeId={recipe.id} recipeName={recipe.name} size={40} />
					</View>
				</View>
				<View style={[styles.content, { backgroundColor: colors.bgApp }]}>
					<View style={styles.title}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{recipe.cuisine} · {recipe.slots.map(slotLabel).join(", ")}
						</PoText>
						<PoText variant="title30" accessibilityRole="header">
							{recipe.name}
						</PoText>
						<View style={styles.chips}>
							<MetaChip icon="Clock" label={`${recipe.minutes} min`} />
							<MetaChip icon="Lightning" label={`${recipe.kcal} kcal`} />
							<MetaChip icon="Dumbbell" label={`${recipe.protein} g protein`} />
							<MetaChip icon="Food" label={`Serves ${recipe.serves}`} />
						</View>
					</View>
					<MacroSplit recipe={recipe} />
					<View style={[styles.fit, { backgroundColor: colors.bgSurface }]}>
						<View style={[styles.fitIcon, { backgroundColor: colors.statusVioletSubtle }]}>
							<Icon name="Filled/Sparkle" size={16} color={colors.statusViolet} />
						</View>
						<PoText variant="meta13" tone="textSecondary" style={styles.grow}>
							{fit.lead}
							<PoText variant="meta13">{fit.strong}</PoText>
							{fit.tail}
						</PoText>
						<Stepper value={portions} onChange={setPortions} />
					</View>
					{logged ? (
						<PoText variant="meta13" tone="textSuccess" style={styles.loggedLine}>
							Logged to {slotLabel(logged.slot).toLowerCase()} at {clock(new Date(logged.at))} ·{" "}
							{formatKcal(logged.kcal)} kcal
						</PoText>
					) : null}
					<Ingredients recipe={recipe} />
					<Steps recipe={recipe} />
				</View>
			</ScrollView>
			<View style={[styles.footer, { bottom: insets.bottom + 12 }]}>
				<PillButton
					variant="secondary"
					label="Cook mode"
					onPress={() => setCooking(true)}
					style={styles.grow}
				/>
				<PillButton label="Log this meal" onPress={logThis} style={styles.grow} />
			</View>
			{cooking ? <CookMode recipe={recipe} onClose={() => setCooking(false)} /> : null}
			{draft ? (
				<LogMealSheet
					key={draft.key}
					draft={draft.value}
					day={day.today}
					onClose={() => setDraft(null)}
					onLogged={setLogged}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	notFound: { gap: 12, paddingHorizontal: 16 },
	top: {
		position: "absolute",
		left: 16,
		right: 16,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	content: {
		marginTop: -32,
		gap: 18,
		paddingTop: 22,
		paddingHorizontal: 16,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
	},
	title: { gap: 10, paddingHorizontal: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 10,
		paddingRight: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	macros: { gap: 8, paddingHorizontal: 4 },
	split: { height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row", gap: 2 },
	legend: { flexDirection: "row", justifyContent: "space-between" },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	legendDot: { width: 8, height: 8, borderRadius: 4 },
	fit: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 28 },
	fitIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	grow: { flex: 1 },
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 4,
		borderRadius: 20,
	},
	stepButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	loggedLine: { paddingHorizontal: 4 },
	sectionHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 4,
	},
	list: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 28 },
	ingredient: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	steps: { gap: 14, paddingHorizontal: 4 },
	step: { flexDirection: "row", gap: 12 },
	stepNumber: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	stepText: { flex: 1, gap: 6, alignItems: "flex-start" },
	timer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 8,
		paddingRight: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	footer: { position: "absolute", left: 16, right: 16, flexDirection: "row", gap: 10 },
});
