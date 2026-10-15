import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { toTextStyle, usePoTheme } from "@/theme";
import { saveRecipeState } from "../data/food-actions";
import { useFoodToday } from "../hooks/use-food";
import { nextSlot, pickRecipe } from "../lib/food-math";
import { SLOT_LABELS, SLOT_TIMES } from "../lib/food-model";
import { RECIPES, type Recipe, type RecipeTag, TAG_LABELS } from "../lib/recipes";
import { remaining } from "../lib/targets";
import { foodRoutes } from "../navigation";
import { FoodScreen } from "./food-screen";
import { kcalText } from "./home-cards";
import { MealImage } from "./meal-image";

const inputStyle = toTextStyle(textStyles.body15);

type Filter = "for-you" | "saved" | RecipeTag;

const FILTERS: readonly { id: Filter; label: string }[] = [
	{ id: "for-you", label: "For you" },
	{ id: "high-protein", label: TAG_LABELS["high-protein"] },
	{ id: "bulk", label: TAG_LABELS.bulk },
	{ id: "desi", label: TAG_LABELS.desi },
	{ id: "quick", label: TAG_LABELS.quick },
	{ id: "cheap", label: TAG_LABELS.cheap },
	{ id: "saved", label: "Saved" },
];

export function HeartButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={saved ? "Remove from saved" : "Save recipe"}
			accessibilityState={{ selected: saved }}
			hitSlop={8}
			onPress={() => {
				haptics.select();
				onPress();
			}}
			style={[styles.heart, { backgroundColor: colors.bgSubtle }]}
		>
			<Icon name="Heart" size={18} color={saved ? colors.statusDanger : colors.textSecondary} />
		</Pressable>
	);
}

/** Recipes: a pick for the next meal from what's left today, then the rest to browse. */
export function RecipesScreen() {
	const { colors } = usePoTheme();
	const { data, eaten, now } = useFoodToday();
	const [filter, setFilter] = useState<Filter>("for-you");
	const [searching, setSearching] = useState(false);
	const [query, setQuery] = useState("");
	const left = remaining(data.settings.targets, eaten);
	const slot = nextSlot(now.getHours() * 60 + now.getMinutes(), SLOT_TIMES);
	const featured = pickRecipe(slot, left);
	const saved = new Set(data.recipes.filter((state) => state.saved).map((state) => state.id));
	const words = query.trim().toLowerCase();
	const shown = RECIPES.filter((recipe) => {
		if (words) {
			return (
				recipe.name.toLowerCase().includes(words) ||
				recipe.ingredients.some((item) => item.name.toLowerCase().includes(words))
			);
		}
		if (filter === "for-you") return recipe.id !== featured?.id;
		if (filter === "saved") return saved.has(recipe.id);
		return recipe.tags.includes(filter);
	});

	const toggleSaved = (recipe: Recipe) => {
		const state = data.recipes.find((item) => item.id === recipe.id);
		saveRecipeState({
			id: recipe.id,
			saved: !saved.has(recipe.id),
			atHome: state?.atHome ?? [],
		}).catch((error: unknown) => console.error("[food] could not save the recipe", error));
	};

	const showFeatured = featured && filter === "for-you" && !query.trim();

	return (
		<FoodScreen
			label="Recipes"
			action={{
				icon: "Search",
				label: "Search recipes",
				onPress: () => setSearching((value) => !value),
			}}
		>
			{searching ? (
				<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
					<Icon name="Search" size={16} color={colors.textSecondary} />
					<TextInput
						value={query}
						onChangeText={setQuery}
						placeholder="Dish or ingredient"
						placeholderTextColor={colors.textTertiary}
						style={[inputStyle, styles.flex, { color: colors.textPrimary }]}
					/>
				</View>
			) : null}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filters}
			>
				{FILTERS.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={filter === item.id}
						onPress={() => setFilter(item.id)}
					/>
				))}
			</ScrollView>

			{showFeatured ? (
				<>
					<View style={styles.tip}>
						<Icon name="Filled/Sparkle" size={16} color={colors.accentDefault} />
						<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
							{`Picked for ${SLOT_LABELS[slot].toLowerCase()}: `}
							<PoText variant="meta13">{`${Math.round(left.protein)} g protein`}</PoText>
							{" and "}
							<PoText variant="meta13">{`${kcalText(left.kcal)} kcal`}</PoText>
							{" left today."}
						</PoText>
					</View>
					<Pressable
						accessibilityRole="button"
						onPress={() => foodRoutes.recipe(featured.id)}
						style={[
							styles.featured,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<MealImage recipeId={featured.id} hero size={200} fill radius={22} />
						<View style={styles.featuredText}>
							<View style={styles.featuredHead}>
								<PoText variant="title18" style={styles.flex}>
									{featured.name}
								</PoText>
								<HeartButton saved={saved.has(featured.id)} onPress={() => toggleSaved(featured)} />
							</View>
							<PoText variant="meta13" tone="textSecondary">
								{`${featured.minutes} min  •  ${featured.kcal} kcal  •  ${featured.protein} g protein`}
							</PoText>
							{featured.kcal <= left.kcal + 150 ? (
								<View style={styles.fits}>
									<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
									<PoText variant="meta13" tone="textSuccess">
										{`Fits your ${SLOT_LABELS[slot].toLowerCase()}`}
									</PoText>
								</View>
							) : null}
						</View>
					</Pressable>
				</>
			) : null}

			<View style={styles.sectionHead}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{query.trim()
						? `${shown.length} found`
						: showFeatured
							? "More for you"
							: `${shown.length} recipes`}
				</PoText>
			</View>
			{shown.length === 0 ? (
				<PoText variant="body15" tone="textSecondary" style={styles.none}>
					{filter === "saved"
						? "Tap the heart on a recipe to keep it here."
						: "Nothing matches yet."}
				</PoText>
			) : (
				<View style={styles.grid}>
					{shown.map((recipe) => (
						<Pressable
							key={recipe.id}
							accessibilityRole="button"
							onPress={() => foodRoutes.recipe(recipe.id)}
							style={[
								styles.tile,
								{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
							]}
						>
							<MealImage recipeId={recipe.id} size={110} fill radius={18} />
							<View style={styles.tileText}>
								<PoText variant="row15" numberOfLines={1}>
									{recipe.name}
								</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{`${recipe.minutes} min  •  ${recipe.kcal} kcal`}
								</PoText>
							</View>
						</Pressable>
					))}
				</View>
			)}
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingHorizontal: 14,
		borderRadius: 24,
	},
	filters: { gap: 8 },
	tip: { flexDirection: "row", gap: 10, paddingHorizontal: 6 },
	featured: { padding: 8, borderRadius: 28, borderWidth: 1 },
	featuredText: { gap: 6, padding: 10 },
	featuredHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	fits: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	heart: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	sectionHead: { paddingHorizontal: 6, paddingTop: 4 },
	none: { paddingHorizontal: 6 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	tile: { width: "48.5%", padding: 6, borderRadius: 24, borderWidth: 1 },
	tileText: { gap: 2, padding: 8 },
});
