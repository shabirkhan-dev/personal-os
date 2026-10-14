import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { HeaderButton } from "@/components/ui/header-button";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { useFoodDay } from "../hooks/use-food-day";
import { findRecipes, fitsCalories, RECIPE_FILTERS, type RecipeFilter } from "../lib/match";
import { formatKcal, slotForTime, slotLabel } from "../lib/meals";
import { RECIPES, type Recipe } from "../lib/recipes";
import { openRecipe } from "../navigation";
import { useFoodStore } from "../store/food-store";
import { FavouriteButton } from "./favourite-button";
import { RecipeArt } from "./recipe-art";

const searchStyle = toTextStyle(textStyles.body15);

function Dot() {
	const { colors } = usePoTheme();
	return <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />;
}

function FilterChips({
	value,
	onChange,
}: {
	value: RecipeFilter;
	onChange: (value: RecipeFilter) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.filters}
			style={styles.filtersScroll}
		>
			{RECIPE_FILTERS.map((filter) => {
				const selected = filter.value === value;
				return (
					<Pressable
						key={filter.value}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						onPress={() => {
							haptics.select();
							onChange(filter.value);
						}}
						style={[
							styles.filter,
							selected
								? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
								: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<PoText variant="meta13" tone={selected ? "textOnAccent" : "textSecondary"}>
							{filter.label}
						</PoText>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}

function FeaturedCard({ recipe, fits, slot }: { recipe: Recipe; fits: boolean; slot: string }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutes, ${recipe.kcal} kcal`}
			onPress={() => openRecipe(recipe.id)}
			style={[
				styles.featured,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<RecipeArt recipe={recipe} height={200} radius={22} glyph={56} />
			<View style={styles.featuredText}>
				<View style={styles.titleRow}>
					<PoText variant="title18" style={styles.grow} numberOfLines={2}>
						{recipe.name}
					</PoText>
					<FavouriteButton recipeId={recipe.id} recipeName={recipe.name} />
				</View>
				<View style={styles.meta}>
					<PoText variant="meta13" tone="textSecondary">
						{recipe.minutes} min
					</PoText>
					<Dot />
					<PoText variant="meta13" tone="textSecondary">
						{recipe.kcal} kcal
					</PoText>
					<Dot />
					<PoText variant="meta13" tone="textSecondary">
						{recipe.protein} g protein
					</PoText>
				</View>
				<View style={styles.meta}>
					<View
						style={[
							styles.fitDot,
							{ backgroundColor: fits ? colors.statusSuccess : colors.statusCaution },
						]}
					/>
					<PoText variant="meta13" tone={fits ? "textSuccess" : "textWarning"}>
						{fits ? `Fits your ${slot}` : "More than you have left today"}
					</PoText>
				</View>
			</View>
		</Pressable>
	);
}

function GridCard({ recipe }: { recipe: Recipe }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutes, ${recipe.kcal} kcal`}
			onPress={() => openRecipe(recipe.id)}
			style={[
				styles.tile,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<RecipeArt recipe={recipe} height={110} radius={18} glyph={32} />
			<View style={styles.tileText}>
				<PoText variant="row15" numberOfLines={2}>
					{recipe.name}
				</PoText>
				<View style={styles.meta}>
					<PoText variant="meta13" tone="textSecondary">
						{recipe.minutes} min
					</PoText>
					<Dot />
					<PoText variant="meta13" tone="textSecondary">
						{recipe.kcal} kcal
					</PoText>
				</View>
			</View>
		</Pressable>
	);
}

function pairs<T>(items: readonly T[]): T[][] {
	const rows: T[][] = [];
	for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));
	return rows;
}

/** Food · Recipes (Figma 181:1232): bundled recipes, filtered and ranked for what is left today. */
export function RecipesScreen() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const day = useFoodDay();
	const saved = useFoodStore((state) => state.data.favourites);
	const [filter, setFilter] = useState<RecipeFilter>("for-you");
	const [searching, setSearching] = useState(false);
	const [search, setSearch] = useState("");

	const slot = slotForTime(day.now);
	const slotName = slotLabel(slot).toLowerCase();
	const results = useMemo(
		() => findRecipes(RECIPES, { filter, search, left: day.left, slot, saved }),
		[filter, search, day.left, slot, saved],
	);
	const [featured, ...rest] = results;

	return (
		<View style={[styles.screen, { backgroundColor: colors.bgApp }]}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
				]}
			>
				<View style={styles.header}>
					<HeaderButton accessibilityLabel="Back" onPress={() => router.back()} />
					<View
						style={[
							styles.titlePill,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<Icon name="Food" size={16} color={colors.textSecondary} />
						<PoText variant="text14Medium" accessibilityRole="header">
							Recipes
						</PoText>
					</View>
					<HeaderButton
						icon={searching ? "Line/Close" : "Search"}
						accessibilityLabel={searching ? "Close search" : "Search recipes"}
						onPress={() => {
							if (searching) setSearch("");
							setSearching((value) => !value);
						}}
					/>
				</View>

				{searching ? (
					<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
						<Icon name="Search" size={16} color={colors.textSecondary} />
						<TextInput
							value={search}
							onChangeText={setSearch}
							placeholder="Search by dish or ingredient"
							placeholderTextColor={colors.textTertiary}
							returnKeyType="search"
							accessibilityLabel="Search recipes"
							selectionColor={colors.accentDefault}
							style={[searchStyle, styles.searchInput, { color: colors.textPrimary }]}
						/>
					</View>
				) : null}

				<FilterChips value={filter} onChange={setFilter} />

				{filter === "for-you" && !search ? (
					<View style={styles.pick}>
						<Icon name="Filled/Sparkle" size={16} color={colors.statusViolet} />
						<PoText variant="meta13" tone="textSecondary" style={styles.grow}>
							{day.left.kcal > 0 ? (
								<>
									Picked for {slotName}:{" "}
									<PoText variant="meta13">{Math.round(day.left.protein)} g protein</PoText> and{" "}
									<PoText variant="meta13">{formatKcal(day.left.kcal)} kcal</PoText> left today.
								</>
							) : (
								"You've reached today's calories, so the lightest dishes come first."
							)}
						</PoText>
					</View>
				) : null}

				{featured ? (
					<FeaturedCard recipe={featured} fits={fitsCalories(featured, day.left)} slot={slotName} />
				) : (
					<View
						style={[
							styles.empty,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<PoText variant="row15">
							{filter === "saved" && !search ? "No saved recipes yet" : "No recipes match"}
						</PoText>
						<PoText variant="meta13" tone="textSecondary" style={styles.centerText}>
							{filter === "saved" && !search
								? "Tap the heart on a recipe to keep it here."
								: "Try another word or filter."}
						</PoText>
						<PillButton
							variant="secondary"
							label="Show all recipes"
							onPress={() => {
								setSearch("");
								setFilter("for-you");
							}}
						/>
					</View>
				)}

				{rest.length > 0 ? (
					<>
						<View style={styles.sectionHead}>
							<PoText variant="eyebrow11" tone="textTertiary">
								{filter === "for-you" ? "More for you" : "More"}
							</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{results.length} recipes
							</PoText>
						</View>
						<View style={styles.grid}>
							{pairs(rest).map((row) => (
								<View key={row.map((recipe) => recipe.id).join("+")} style={styles.gridRow}>
									{row.map((recipe) => (
										<GridCard key={recipe.id} recipe={recipe} />
									))}
									{row.length === 1 ? <View style={styles.grow} /> : null}
								</View>
							))}
						</View>
					</>
				) : null}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	content: { gap: 16, paddingHorizontal: 16 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingBottom: 12,
	},
	titlePill: {
		height: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 14,
		borderRadius: 20,
		borderWidth: 1,
	},
	search: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 16,
		borderRadius: 24,
	},
	searchInput: { flex: 1, paddingVertical: 0 },
	filtersScroll: { marginHorizontal: -16 },
	filters: { gap: 8, paddingHorizontal: 16 },
	filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
	pick: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4 },
	grow: { flex: 1 },
	featured: {
		gap: 12,
		paddingTop: 8,
		paddingHorizontal: 8,
		paddingBottom: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	featuredText: { gap: 6, paddingHorizontal: 10 },
	titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	meta: { flexDirection: "row", alignItems: "center", gap: 10 },
	dot: { width: 3, height: 3, borderRadius: 1.5 },
	fitDot: { width: 6, height: 6, borderRadius: 3, marginRight: -4 },
	sectionHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 4,
		paddingHorizontal: 4,
	},
	grid: { gap: 10 },
	gridRow: { flexDirection: "row", gap: 10 },
	tile: {
		flex: 1,
		gap: 10,
		paddingTop: 6,
		paddingHorizontal: 6,
		paddingBottom: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
	tileText: { gap: 3, paddingHorizontal: 6 },
	empty: { alignItems: "center", gap: 10, padding: 24, borderRadius: 28, borderWidth: 1 },
	centerText: { textAlign: "center" },
});
