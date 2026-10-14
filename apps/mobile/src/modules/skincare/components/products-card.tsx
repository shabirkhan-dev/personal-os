import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { ProductUsage } from "../lib/products";
import type { Product } from "../lib/skincare-types";
import { CardHead } from "./card-head";

export type ProductRow = { product: Product; usage: ProductUsage };

export type ProductsCardProps = {
	rows: readonly ProductRow[];
	onAdd: () => void;
	onReorder: (product: Product) => void;
	onRemove: (product: Product) => void;
};

/** Healthy products alternate violet and green like the Figma rows; low ones turn caution. */
const PALETTE: readonly { fill: keyof ColorTokens; tile: keyof ColorTokens }[] = [
	{ fill: "statusViolet", tile: "statusVioletSubtle" },
	{ fill: "statusSuccess", tile: "statusSuccessSubtle" },
];
const LOW = { fill: "statusCaution", tile: "statusCautionSubtle" } as const;

/** "Your products": how much of each bottle is left, estimated from when it was opened. */
export function ProductsCard({ rows, onAdd, onReorder, onRemove }: ProductsCardProps) {
	const { colors } = usePoTheme();
	return (
		<Card style={styles.card}>
			<CardHead
				title="Your products"
				meta={rows.length > 0 ? `${rows.length} in use` : "None yet"}
			/>
			{rows.length === 0 ? (
				<PoText variant="meta13" tone="textTertiary" style={styles.empty}>
					Add the products you use and we will tell you when one is running low.
				</PoText>
			) : null}
			{rows.map((row, index) => (
				<ProductItem
					key={row.product.id}
					row={row}
					palette={row.usage.low ? LOW : (PALETTE[index % PALETTE.length] ?? LOW)}
					divider={index < rows.length - 1}
					onReorder={() => onReorder(row.product)}
					onRemove={() => onRemove(row.product)}
				/>
			))}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Add a product"
				onPress={() => {
					haptics.tap();
					onAdd();
				}}
				style={[styles.add, { borderTopColor: colors.borderDefault }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					{rows.length > 0 ? "Add product" : "Add the products you use"}
				</PoText>
			</Pressable>
		</Card>
	);
}

type ProductItemProps = {
	row: ProductRow;
	palette: { fill: keyof ColorTokens; tile: keyof ColorTokens };
	divider: boolean;
	onReorder: () => void;
	onRemove: () => void;
};

function ProductItem({ row, palette, divider, onReorder, onRemove }: ProductItemProps) {
	const { colors } = usePoTheme();
	const { product, usage } = row;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${product.name}, ${usage.leftPercent}% left`}
			accessibilityHint="Long press to remove"
			onLongPress={() => {
				haptics.select();
				onRemove();
			}}
			style={[
				styles.row,
				divider ? { borderBottomWidth: 1, borderBottomColor: colors.borderDefault } : null,
			]}
		>
			<View style={[styles.tile, { backgroundColor: colors[palette.tile] }]}>
				<Icon name="Drop" color={colors[palette.fill]} />
			</View>
			<View style={styles.text}>
				<View style={styles.top}>
					<PoText variant="row15" numberOfLines={1} style={styles.name}>
						{product.name}
					</PoText>
					<PoText variant="mono13" tone="textSecondary">
						{usage.leftPercent}%
					</PoText>
				</View>
				<View style={[styles.level, { backgroundColor: colors.bgSubtle }]}>
					<View
						style={[
							styles.fill,
							{ width: `${usage.leftPercent}%`, backgroundColor: colors[palette.fill] },
						]}
					/>
				</View>
				<PoText variant="meta13" tone={usage.low ? "textWarning" : "textTertiary"}>
					{usage.leftLabel}
				</PoText>
			</View>
			{usage.low ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Reorder ${product.name}`}
					onPress={() => {
						haptics.tap();
						onReorder();
					}}
					style={[
						styles.reorder,
						{ backgroundColor: colors.bgSubtle, borderColor: colors.borderDefault },
					]}
				>
					<PoText variant="meta13">Reorder</PoText>
				</Pressable>
			) : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: { gap: 6, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 6 },
	empty: { paddingVertical: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	tile: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, gap: 6 },
	top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
	name: { flexShrink: 1 },
	level: { height: 4, borderRadius: 2, overflow: "hidden" },
	fill: { height: 4, borderRadius: 2 },
	reorder: {
		height: 36,
		paddingHorizontal: 14,
		borderRadius: 18,
		borderWidth: 1,
		justifyContent: "center",
	},
	add: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 12,
		borderTopWidth: 1,
	},
});
