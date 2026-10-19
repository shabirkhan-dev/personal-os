import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { deleteDream, reorder } from "../data/wishlist-actions";
import { useDreamSavings } from "../hooks/use-dream-savings";
import { useWishlistToday } from "../hooks/use-wishlist";
import { amountLeft, compactMoney, inLine, monthsFor } from "../lib/wishlist-math";
import { CATEGORY_LABELS, type Dream, type DreamCategory } from "../lib/wishlist-model";
import { wishlistRoutes } from "../navigation";
import { DreamImage } from "./dream-image";
import { WishlistScreen } from "./wishlist-screen";

const ONE: Record<DreamCategory, string> = {
	tech: "one",
	bikes: "bike",
	cars: "car",
	gear: "one",
	trips: "trip",
	other: "one",
};

function specValue(dream: Dream, label: string): string {
	return dream.specs.find((spec) => spec.label === label)?.value ?? "–";
}

/** The two dreams to compare: from the route, or the first two open ones in one category. */
function pair(dreams: readonly Dream[], a?: string, b?: string): [Dream, Dream] | null {
	const line = inLine(dreams);
	const first = line.find((dream) => dream.id === a);
	const second = line.find((dream) => dream.id === b && dream.id !== first?.id);
	if (first && second) return [first, second];
	const base = first ?? line[0];
	const other = line.find((dream) => dream.id !== base?.id && dream.category === base?.category);
	return base && other ? [base, other] : null;
}

/** Compare: two options side by side, their specs, saving time and the reason; pick one. */
export function CompareScreen({ a, b }: { a?: string; b?: string }) {
	const { colors } = usePoTheme();
	const { data, monthly } = useWishlistToday();
	const savings = useDreamSavings();
	const options = pair(data.dreams, a, b);
	const [chosen, setChosen] = useState(0);

	if (!options) {
		return (
			<WishlistScreen>
				{data.loading ? (
					<ActivityIndicator color={colors.accentDefault} />
				) : (
					<EmptyCard
						icon="Layers"
						title="Two of a kind to compare"
						body="Add two dreams in the same category, like two laptops, and compare price, specs and saving time here."
					>
						<PillButton label="Add a dream" onPress={() => wishlistRoutes.add()} />
					</EmptyCard>
				)}
			</WishlistScreen>
		);
	}

	const pick = options[chosen] ?? options[0];
	const other = options[chosen === 0 ? 1 : 0] ?? options[1];
	const labels = [...new Set([...options[0].specs, ...options[1].specs].map((spec) => spec.label))];
	const months = (dream: Dream) => {
		const count = monthsFor(amountLeft(dream), monthly);
		return count === null ? "–" : `${count} ${count === 1 ? "month" : "months"}`;
	};

	const choose = () =>
		Alert.alert(
			`Pick ${pick.name}?`,
			`${pick.name} goes first in line and ${other.name} leaves the list${
				other.savedAmount > 0 ? "; what you saved for it goes back to the budget" : ""
			}.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: `Pick ${pick.name}`,
					onPress: () =>
						void (async () => {
							await savings.undoAll(other);
							await deleteDream(other, data.dreams);
							await reorder(
								data.dreams.filter((dream) => dream.id !== other.id),
								pick.id,
								0,
							);
							haptics.success();
							router.back();
						})().catch((error: unknown) => console.error("[wishlist] could not pick", error)),
				},
			],
		);

	return (
		<WishlistScreen>
			<ScreenTitle
				eyebrow={`${CATEGORY_LABELS[pick.category]} · two options`}
				title={`Which ${ONE[pick.category]}?`}
			/>
			<View style={styles.pair}>
				{options.map((dream, index) => {
					const selected = index === chosen;
					return (
						<Pressable
							key={dream.id}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							accessibilityLabel={`${dream.name}, ${compactMoney(dream.price)}`}
							onPress={() => {
								haptics.select();
								setChosen(index);
							}}
							style={[
								styles.option,
								{
									backgroundColor: colors.bgSurface,
									borderColor: selected ? colors.accentDefault : colors.bgSurface,
								},
							]}
						>
							<DreamImage photo={dream.photo} category={dream.category} height={120} radius={16} />
							<View style={styles.optionText}>
								<PoText variant="title18" numberOfLines={1}>
									{dream.name}
								</PoText>
								<PoText variant="mono13" tone={selected ? "accentDefault" : "textTertiary"}>
									{compactMoney(dream.price)}
								</PoText>
							</View>
						</Pressable>
					);
				})}
			</View>

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<View style={styles.tableRow}>
					<View style={styles.label} />
					{options.map((dream) => (
						<PoText
							key={dream.id}
							variant="eyebrow11"
							tone="textTertiary"
							style={styles.cell}
							numberOfLines={1}
						>
							{dream.name}
						</PoText>
					))}
				</View>
				{labels.map((label) => (
					<SpecRow
						key={label}
						label={label}
						values={options.map((dream) => specValue(dream, label))}
					/>
				))}
				<SpecRow label="Saving time" values={options.map(months)} />
				{labels.length === 0 ? (
					<PoText variant="meta13" tone="textTertiary">
						Add specs to each dream (Edit → Specs) to compare them here.
					</PoText>
				) : null}
			</View>

			{pick.notes ? (
				<View style={[styles.card, { backgroundColor: colors.accentSubtle }]}>
					<PoText variant="eyebrow11" tone="accentDefault">
						Your reason
					</PoText>
					<PoText variant="body15">{pick.notes}</PoText>
				</View>
			) : null}

			<Footer>
				<PillButton
					variant="secondary"
					label="Keep both"
					style={styles.flex}
					onPress={() => router.back()}
				/>
				<PillButton label={`Pick ${pick.name}`} style={styles.flex} onPress={choose} />
			</Footer>
		</WishlistScreen>
	);
}

function SpecRow({ label, values }: { label: string; values: readonly string[] }) {
	return (
		<View style={styles.tableRow}>
			<PoText variant="meta13" tone="textTertiary" style={styles.label}>
				{label}
			</PoText>
			{values.map((value, index) => (
				// Two fixed columns, one per option.
				// oxlint-disable-next-line react/no-array-index-key
				<PoText key={index} variant="meta13" style={styles.cell}>
					{value}
				</PoText>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pair: { flexDirection: "row", gap: 10 },
	option: { flex: 1, gap: 8, padding: 10, borderRadius: 24, borderWidth: 1.5 },
	optionText: { gap: 2, paddingHorizontal: 4, paddingBottom: 4 },
	card: { gap: 4, padding: 16, borderRadius: 28 },
	tableRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
	label: { flex: 1.2 },
	cell: { flex: 1 },
});
