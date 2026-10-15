import { swatches } from "@personal-os/tokens";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { catalogItem } from "../lib/catalog";
import { capital, type ColourShare } from "../lib/fashion-math";
import type { Piece, Wish } from "../lib/fashion-model";
import type { Look } from "../lib/outfits";
import type { DayParts } from "../lib/weather";
import { PieceImage, Swatch } from "./piece-image";

const PARTS: readonly { key: keyof DayParts; label: string }[] = [
	{ key: "morning", label: "Morning" },
	{ key: "noon", label: "Noon" },
	{ key: "evening", label: "Evening" },
];

function nowPart(hour: number): keyof DayParts {
	if (hour < 11) return "morning";
	return hour < 17 ? "noon" : "evening";
}

export type TodayLookCardProps = {
	look: Look;
	index: number;
	total: number;
	weather: DayParts | null;
	advice: Record<keyof DayParts, string> | null;
	hour: number;
	sprays: number;
	worn: boolean;
	onWear: () => void;
	onNext: () => void;
	onPiece: (piece: Piece) => void;
};

/** "Today's look · 1 of 3": the pieces as photos, the day's temperatures and a scent to finish. */
export function TodayLookCard({
	look,
	index,
	total,
	weather,
	advice,
	hour,
	sprays,
	worn,
	onWear,
	onNext,
	onPiece,
}: TodayLookCardProps) {
	const { colors } = usePoTheme();
	const big = look.clothes.slice(0, 2);
	const small = [...look.clothes.slice(2), ...(look.watch ? [look.watch] : [])].slice(0, 3);
	const legend = [...look.clothes, ...(look.watch ? [look.watch] : [])];
	const current = nowPart(hour);

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.headRow}>
				<View style={styles.flex}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{worn ? "Wearing today" : `Today's look · ${index + 1} of ${total}`}
					</PoText>
					<PoText variant="title30">{look.name}</PoText>
				</View>
				{total > 1 ? (
					<View style={styles.dots}>
						{Array.from({ length: total }, (_, step) => step).map((step) => (
							<View
								key={step}
								style={[
									styles.dot,
									step === index
										? { width: 16, backgroundColor: colors.textPrimary }
										: { backgroundColor: colors.borderStrong },
								]}
							/>
						))}
					</View>
				) : null}
			</View>

			<View style={styles.grid}>
				<View style={styles.row}>
					{big.map((piece) => (
						<Tile key={piece.id} piece={piece} onPress={() => onPiece(piece)} />
					))}
				</View>
				{small.length > 0 ? (
					<View style={styles.row}>
						{small.map((piece) => (
							<Tile key={piece.id} piece={piece} onPress={() => onPiece(piece)} />
						))}
					</View>
				) : null}
			</View>

			<View style={styles.legend}>
				{legend.map((piece) => (
					<View key={piece.id} style={styles.legendItem}>
						<Swatch colour={piece.colour} />
						<PoText variant="meta13" tone="textSecondary">
							{shortName(piece.name)}
						</PoText>
					</View>
				))}
			</View>

			{weather && advice ? (
				<View style={styles.parts}>
					{PARTS.map((part) => {
						const on = part.key === current;
						return (
							<View
								key={part.key}
								style={[
									styles.part,
									{ backgroundColor: on ? colors.accentSubtle : colors.bgSubtle },
								]}
							>
								<PoText variant="eyebrow11" tone={on ? "accentDefault" : "textTertiary"}>
									{part.label}
								</PoText>
								<PoText variant="row15" tone={on ? "accentDefault" : "textPrimary"}>
									{weather[part.key]}°
								</PoText>
								<PoText
									variant="meta13"
									tone={on ? "accentDefault" : "textSecondary"}
									numberOfLines={1}
								>
									{advice[part.key]}
								</PoText>
							</View>
						);
					})}
				</View>
			) : null}

			{look.scent ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => look.scent && onPiece(look.scent)}
					style={[styles.scent, { backgroundColor: colors.bgSubtle }]}
				>
					<PieceImage
						image={look.scent.image}
						category="scent"
						colour={look.scent.colour}
						size={48}
						radius={14}
					/>
					<View style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							Finish with
						</PoText>
						<PoText variant="row15">
							{look.scent.name} · {sprays} spray{sprays === 1 ? "" : "s"}
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{look.scent.scentTime === "evening" ? "Warm, for the evening" : "Fresh, for daytime"}
						</PoText>
					</View>
				</Pressable>
			) : null}

			<View style={styles.actions}>
				<PillButton
					label={worn ? "Worn today ✓" : "Wear this"}
					onPress={onWear}
					disabled={worn}
					style={styles.flex}
				/>
				<PillButton
					label={worn ? "Change" : "Next look"}
					variant="secondary"
					onPress={onNext}
					style={styles.flex}
				/>
			</View>
		</View>
	);
}

function shortName(name: string): string {
	const words = name.split(/\s+/);
	return words.length > 1 &&
		/^(white|grey|black|navy|olive|beige|charcoal|khaki|indigo|brown|blue|steel)$/i.test(
			words[0] ?? "",
		)
		? capital(words.slice(1).join(" "))
		: name;
}

function Tile({ piece, onPress }: { piece: Piece; onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={piece.name}
			onPress={onPress}
			style={styles.tile}
		>
			<PieceImage
				image={piece.image}
				category={piece.category}
				colour={piece.colour}
				size={0}
				fill
				radius={18}
			/>
		</Pressable>
	);
}

/** "Colour story": the two colours that carry the wardrobe, as a bar and a legend. */
export function ColourStoryCard({
	headline,
	story,
}: {
	headline: string;
	story: readonly ColourShare[];
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="eyebrow11" tone="textTertiary">
				Colour story
			</PoText>
			<PoText variant="title18">{headline}</PoText>
			<View style={styles.bar}>
				{story.map((item) => (
					<View
						key={item.colour}
						style={{ flex: item.count, backgroundColor: swatches[item.colour], borderRadius: 6 }}
					/>
				))}
			</View>
			<PoText variant="mono13" tone="textTertiary">
				{story.map((item) => `${capital(item.colour)} ${Math.round(item.share * 100)}%`).join("  ")}
			</PoText>
		</View>
	);
}

/** "In your closet": a row of pieces, with the one sitting idle the longest called out. */
export function ClosetCard({
	pieces,
	count,
	idle,
	onPiece,
	onAll,
}: {
	pieces: readonly Piece[];
	count: number;
	idle: string | null;
	onPiece: (piece: Piece) => void;
	onAll: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<Pressable accessibilityRole="button" onPress={onAll} style={styles.headRow}>
				<PoText variant="title18" style={styles.flex}>
					In your closet
				</PoText>
				<PoText variant="mono13" tone="textSecondary">
					{count} pieces
				</PoText>
				<Icon name="Line/Chevron right" size={14} color={colors.textSecondary} />
			</Pressable>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.closet}
			>
				{pieces.map((piece) => (
					<Pressable
						key={piece.id}
						accessibilityRole="button"
						onPress={() => onPiece(piece)}
						style={styles.closetItem}
					>
						<PieceImage
							image={piece.image}
							category={piece.category}
							colour={piece.colour}
							size={88}
						/>
						<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
							{shortName(piece.name)}
						</PoText>
					</Pressable>
				))}
			</ScrollView>
			{idle ? (
				<View style={styles.legendItem}>
					<View style={[styles.flag, { backgroundColor: colors.statusCaution }]} />
					<PoText variant="meta13" tone="textSecondary">
						{idle}
					</PoText>
				</View>
			) : null}
		</View>
	);
}

/** One line for the wishlist: the first pick and whether buying is on hold. */
export function WishlistRow({
	first,
	count,
	paused,
	onPress,
}: {
	first: Wish;
	count: number;
	paused: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={[
				styles.wish,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PieceImage
				image={first.image}
				category={first.category}
				colour={first.colour}
				size={52}
				radius={14}
			/>
			<View style={styles.flex}>
				<PoText variant="row15" numberOfLines={1}>
					Wishlist · {first.name}
				</PoText>
				<PoText
					variant="meta13"
					tone={paused ? "statusCaution" : "textSecondary"}
					numberOfLines={1}
				>
					{paused
						? "On hold until the new job"
						: first.price !== null
							? formatMoney(first.price)
							: first.reason}
				</PoText>
			</View>
			<PoText variant="mono13" tone="textSecondary">
				{count} item{count === 1 ? "" : "s"}
			</PoText>
			<Icon name="Line/Chevron right" size={14} color={colors.textSecondary} />
		</Pressable>
	);
}

/** "Build your capsule": the empty Home with quick-add starters. */
export function CapsuleCard({
	picked,
	options,
	busy,
	onToggle,
	onAdd,
	onOwn,
}: {
	picked: readonly string[];
	options: readonly string[];
	busy: boolean;
	onToggle: (id: string) => void;
	onAdd: () => void;
	onOwn: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.rail}>
				<View style={[styles.railLine, { backgroundColor: colors.borderStrong }]} />
				<View style={styles.hangers}>
					{[0, 1, 2, 3].map((step) => (
						<View key={step} style={[styles.hanger, { borderColor: colors.borderStrong }]} />
					))}
				</View>
			</View>
			<PoText variant="title18">Build your capsule</PoText>
			<PoText variant="body15" tone="textSecondary">
				Name a piece or paste a link and I'll fill in the rest. Start with what you wear most, then
				I'll suggest outfits.
			</PoText>
			<PoText variant="eyebrow11" tone="textTertiary">
				Quick add · tap what you own
			</PoText>
			<View style={styles.chips}>
				{options.map((id) => {
					const item = catalogItem(id);
					if (!item) return null;
					const on = picked.includes(id);
					return (
						<Pressable
							key={id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: on }}
							onPress={() => {
								haptics.select();
								onToggle(id);
							}}
							style={[
								styles.chip,
								on
									? { backgroundColor: colors.accentSubtle, borderColor: colors.accentDefault }
									: { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle },
							]}
						>
							<Swatch colour={item.colour} size={14} />
							<PoText variant="meta13" tone={on ? "accentDefault" : "textSecondary"}>
								{item.name}
							</PoText>
						</Pressable>
					);
				})}
			</View>
			<PillButton
				label={
					picked.length > 0
						? `Add ${picked.length} piece${picked.length === 1 ? "" : "s"}`
						: "Tap what you own"
				}
				disabled={picked.length === 0 || busy}
				onPress={onAdd}
			/>
			<PillButton label="Add my own" variant="ghost" onPress={onOwn} />
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 14, padding: 18, borderRadius: 28, borderWidth: 1 },
	headRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dots: { flexDirection: "row", gap: 4 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	grid: { gap: 8 },
	row: { flexDirection: "row", gap: 8 },
	tile: { flex: 1 },
	legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 8 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	parts: { flexDirection: "row", gap: 8 },
	part: { flex: 1, gap: 2, padding: 12, borderRadius: 18 },
	scent: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 20 },
	actions: { flexDirection: "row", gap: 8 },
	bar: { flexDirection: "row", gap: 4, height: 24 },
	closet: { gap: 10 },
	closetItem: { width: 88, gap: 6 },
	flag: { width: 8, height: 8, borderRadius: 4 },
	wish: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
	rail: { height: 64, justifyContent: "flex-start" },
	railLine: { height: 3, borderRadius: 2 },
	hangers: { flexDirection: "row", justifyContent: "space-around", paddingTop: 6 },
	hanger: { width: 40, height: 46, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 18,
		borderWidth: 1,
	},
});
