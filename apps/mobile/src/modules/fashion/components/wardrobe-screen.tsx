import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { textStyles } from "@personal-os/tokens";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useNow } from "@/lib/use-now";
import { toTextStyle, usePoTheme } from "@/theme";
import { useFashion } from "../hooks/use-fashion";
import { wearLine } from "../lib/fashion-math";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "../lib/fashion-model";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";
import { PieceImage } from "./piece-image";

const inputStyle = toTextStyle(textStyles.body15);
const UNIT: Partial<Record<Category, string>> = { shoes: "pairs", scent: "bottles" };

/** Wardrobe: every piece by category, with how often it's worn and what sits idle. */
export function WardrobeScreen() {
	const { colors } = usePoTheme();
	const { pieces, wears, loading } = useFashion();
	const now = useNow();
	const [filter, setFilter] = useState<Category | "all">("all");
	const [searching, setSearching] = useState(false);
	const [query, setQuery] = useState("");

	const groups = useMemo(() => {
		const words = query.trim().toLowerCase();
		const matching = words
			? pieces.filter((piece) => piece.name.toLowerCase().includes(words))
			: pieces;
		return CATEGORIES.map((category) => ({
			category,
			items: matching.filter((piece) => piece.category === category),
		})).filter(
			(group) => group.items.length > 0 && (filter === "all" || group.category === filter),
		);
	}, [pieces, filter, query]);

	return (
		<FashionScreen
			action={{
				icon: "Search",
				label: "Search the wardrobe",
				onPress: () => setSearching((value) => !value),
			}}
		>
			<ScreenTitle eyebrow={`${pieces.length} pieces · your closet`} title="Wardrobe" />
			{searching ? (
				<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
					<Icon name="Search" size={16} color={colors.textSecondary} />
					<TextInput
						value={query}
						onChangeText={setQuery}
						placeholder="Find a piece"
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
				<FilterChip
					label={`All ${pieces.length}`}
					selected={filter === "all"}
					onPress={() => setFilter("all")}
				/>
				{CATEGORIES.map((category) => {
					const count = pieces.filter((piece) => piece.category === category).length;
					return count > 0 ? (
						<FilterChip
							key={category}
							label={`${CATEGORY_LABELS[category]} ${count}`}
							selected={filter === category}
							onPress={() => setFilter(category)}
						/>
					) : null;
				})}
			</ScrollView>

			{!loading && pieces.length === 0 ? (
				<EmptyCard
					icon="Shirt"
					title="Nothing here yet"
					body="Add what you wear most and I'll start putting outfits together."
				>
					<PillButton label="Add a piece" onPress={() => fashionRoutes.add()} />
				</EmptyCard>
			) : null}

			{groups.map((group) => (
				<View
					key={group.category}
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<Pressable
						accessibilityRole="button"
						onPress={() => setFilter(group.category)}
						style={styles.head}
					>
						<PoText variant="title18" style={styles.flex}>
							{CATEGORY_LABELS[group.category]}
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{group.items.length} {UNIT[group.category] ?? "pieces"}
						</PoText>
						<Icon name="Line/Chevron right" size={14} color={colors.textTertiary} />
					</Pressable>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.row}
					>
						{group.items.map((piece) => {
							const line =
								piece.category === "scent" && piece.level !== null
									? {
											text: `${piece.scentTime === "evening" ? "Evening" : piece.scentTime === "winter" ? "Winter" : "Day"} · ${Math.round(piece.level * 100)}% left`,
											idle: piece.level < 0.4,
										}
									: wearLine(piece, wears, now);
							return (
								<Pressable
									key={piece.id}
									accessibilityRole="button"
									accessibilityLabel={`${piece.name}, ${line.text}`}
									onPress={() => fashionRoutes.piece(piece.id)}
									style={styles.item}
								>
									<PieceImage
										image={piece.image}
										category={piece.category}
										colour={piece.colour}
										size={104}
									/>
									<PoText variant="text14" numberOfLines={1}>
										{piece.name}
									</PoText>
									<PoText
										variant="meta13"
										tone={line.idle ? "statusCaution" : "textTertiary"}
										numberOfLines={1}
									>
										{line.text}
									</PoText>
								</Pressable>
							);
						})}
					</ScrollView>
				</View>
			))}

			<Pressable
				accessibilityRole="button"
				onPress={() => fashionRoutes.add({ category: filter === "all" ? undefined : filter })}
				style={[styles.add, { borderColor: colors.borderDefault }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					Add a piece · paste a link or name it
				</PoText>
			</Pressable>
		</FashionScreen>
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
	card: { gap: 14, padding: 16, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 6 },
	row: { gap: 10 },
	item: { width: 104, gap: 4 },
	add: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 52,
		borderRadius: 26,
		borderWidth: 1,
		borderStyle: "dashed",
	},
});
