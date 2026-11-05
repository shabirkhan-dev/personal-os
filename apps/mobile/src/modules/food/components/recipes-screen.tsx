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
import { allRecipes, type Recipe, type RecipeTag, TAG_LABELS } from "../lib/recipes";
import { remaining } from "../lib/targets";
import { foodRoutes } from "../navigation";
import { FoodScreen } from "./food-screen";
import { kcalText } from "./home-cards";
import { MealImage } from "./meal-image";

const inputStyle = toTextStyle(textStyles.body15);

type Filter = "for-you" | "mine" | "saved" | RecipeTag;

const FILTERS: readonly { id: Filter; label: string }[] = [
	{ id: "for-you", label: "For you" },
	{ id: "mine", label: "My recipes" },
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
	const [query, setQuery] = useState("");
	const left = remaining(data.settings.targets, eaten);
	const slot = nextSlot(now.getHours() * 60 + now.getMinutes(), SLOT_TIMES);
	const featured = pickRecipe(slot, left);
	const saved = new Set(data.recipes.filter((state) => state.saved).map((state) => state.id));
	const words = query.trim().toLowerCase();
	const shown = allRecipes().filter((recipe) => {
		if (words) {
			return (
				recipe.name.toLowerCase().includes(words) ||
				recipe.ingredients.some((item) => item.name.toLowerCase().includes(words))
			);
		}
		if (filter === "for-you") return recipe.id !== featured?.id;
		if (filter === "mine") return recipe.mine === true;
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
				icon: "Line/Plus",
				label: "Write a recipe",
				onPress: () => foodRoutes.recipeEdit(),
			}}
		>
			<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Search" size={16} color={colors.textSecondary} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search a dish or an ingredient"
					placeholderTextColor={colors.textTertiary}
					accessibilityLabel="Search recipes"
					style={[inputStyle, styles.flex, { color: colors.textPrimary }]}
				/>
				{query ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Clear search"
						hitSlop={8}
						onPress={() => setQuery("")}
					>
						<Icon name="Line/Close" size={14} color={colors.textSecondary} />
					</Pressable>
				) : null}
			</View>
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

			{filter === "mine" || (showFeatured && data.myRecipes.length === 0) ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => foodRoutes.recipeEdit()}
					style={({ pressed }) => [
						styles.write,
						{ backgroundColor: pressed ? colors.bgHover : colors.accentSubtle },
					]}
				>
					<View style={[styles.writeIcon, { backgroundColor: colors.accentDefault }]}>
						<Icon name="Filled/Edit" size={16} color={colors.textOnAccent} />
					</View>
					<View style={styles.flex}>
						<PoText variant="row15">Write your own recipe</PoText>
						<PoText variant="meta13" tone="textSecondary">
							A photo, ingredients, steps with timers and a video link. It plans and shops like the
							rest.
						</PoText>
					</View>
				</Pressable>
			) : null}

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
						style={[styles.featured, { backgroundColor: colors.bgSurface }]}
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
							? "More recipes"
							: `${shown.length} recipes`}
				</PoText>
			</View>
			{shown.length === 0 ? (
				<PoText variant="body15" tone="textSecondary" style={styles.none}>
					{filter === "saved"
						? "Tap the heart on a recipe to keep it here."
						: filter === "mine"
							? "The recipes you write show here."
							: "Nothing matches yet."}
				</PoText>
			) : (
				<View style={styles.grid}>
					{shown.map((recipe) => (
						<Pressable
							key={recipe.id}
							accessibilityRole="button"
							onPress={() => foodRoutes.recipe(recipe.id)}
							style={[styles.tile, { backgroundColor: colors.bgSurface }]}
						>
							<View>
								<MealImage recipeId={recipe.id} size={110} fill radius={18} />
								<View style={styles.tileHeart}>
									<HeartButton saved={saved.has(recipe.id)} onPress={() => toggleSaved(recipe)} />
								</View>
								{recipe.mine ? (
									<View style={[styles.badge, { backgroundColor: colors.accentDefault }]}>
										<PoText variant="eyebrow11" tone="textOnAccent">
											Yours
										</PoText>
									</View>
								) : null}
							</View>
							<View style={styles.tileText}>
								<PoText variant="row15" numberOfLines={1}>
									{recipe.name}
								</PoText>
								<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
									{[
										`${recipe.minutes} min`,
										recipe.kcal ? `${recipe.kcal} kcal` : "",
										recipe.protein ? `${recipe.protein} g protein` : "",
									]
										.filter(Boolean)
										.join("  •  ")}
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
	flex: { flex: 1, minWidth: 0 },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingHorizontal: 16,
		borderRadius: 24,
	},
	filters: { gap: 8 },
	tip: { flexDirection: "row", gap: 12, paddingHorizontal: 8 },
	featured: { padding: 8, borderRadius: 20 },
	featuredText: { gap: 8, padding: 12 },
	featuredHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	fits: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	heart: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	sectionHead: { paddingHorizontal: 8, paddingTop: 4 },
	none: { paddingHorizontal: 8 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	tile: { width: "48.5%", padding: 8, borderRadius: 20 },
	tileText: { gap: 2, padding: 8 },
	tileHeart: { position: "absolute", top: 6, right: 6 },
	badge: {
		position: "absolute",
		left: 8,
		top: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
	},
	write: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20 },
	writeIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
});
