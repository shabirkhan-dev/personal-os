import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { savePiece, savePlan, wearLook } from "../data/fashion-actions";
import { useFashion } from "../hooks/use-fashion";
import { contextFor } from "../hooks/use-fashion-today";
import { useWeather } from "../hooks/use-weather";
import {
	capital,
	costPerWear,
	daysSinceWorn,
	goesWith,
	pairsWith,
	wornCount,
} from "../lib/fashion-math";
import { CATEGORY_ONE } from "../lib/fashion-model";
import { lookPieceIds, looksFor } from "../lib/outfits";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";
import { PieceImage } from "./piece-image";

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function boughtLabel(day: string | null): string {
	if (!day) return "";
	const [year, month] = day.split("-");
	return ` · bought ${MONTHS[Number(month) - 1] ?? ""} ${year}`;
}

/** Piece detail: the photo, how often and how cheaply it's worn, what it pairs with, its details. */
export function PieceDetailScreen({ id }: { id: string }) {
	const { colors } = usePoTheme();
	const data = useFashion();
	const weather = useWeather();
	const now = useNow();
	const [notice, setNotice] = useState<string | null>(null);
	const piece = data.pieces.find((item) => item.id === id);

	if (!piece) {
		return (
			<FashionScreen>
				<EmptyCard
					icon="Shirt"
					title={data.loading ? "Loading…" : "Piece not found"}
					body={data.loading ? "" : "It may have been removed on another device."}
				>
					<PillButton
						label="Back to wardrobe"
						variant="secondary"
						onPress={fashionRoutes.wardrobe}
					/>
				</EmptyCard>
			</FashionScreen>
		);
	}

	const worn = wornCount(piece.id, data.wears);
	const perWear = costPerWear(piece, data.wears);
	const since = daysSinceWorn(piece.id, data.wears, now);
	const pairs = pairsWith(piece, data.pieces, data.wears);
	const shownPairs = pairs.length > 0 ? pairs : goesWith(piece, data.pieces);
	const isScent = piece.category === "scent";

	/** The best look that includes this piece for `date`. */
	const lookWith = (date: Date) => {
		const context = contextFor(weather.forecast, date, false);
		// For clothes, the only choice in this piece's category is the piece itself.
		const pool = ["watch", "scent", "extra"].includes(piece.category)
			? data.pieces
			: data.pieces.filter((item) => item.category !== piece.category || item.id === piece.id);
		const look = looksFor(pool, data.wears, context, 1)[0];
		if (!look) return null;
		const ids = lookPieceIds(look);
		return { name: look.name, ids: ids.includes(piece.id) ? ids : [...ids, piece.id] };
	};

	const wearToday = async () => {
		const look = lookWith(now);
		try {
			await wearLook(look?.name ?? piece.name, look?.ids ?? [piece.id], now);
			haptics.success();
			setNotice(`Logged for today${look ? ` with ${look.name.toLowerCase()}` : ""}.`);
		} catch (error) {
			console.error("[fashion] could not log", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const planTomorrow = async () => {
		const tomorrow = addDays(now, 1);
		const look = lookWith(tomorrow);
		if (!look) return;
		const monday = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
		monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
		const plan = data.plans.find((item) => item.id === dayKey(monday));
		const day = dayKey(tomorrow);
		const days = [
			...(plan?.days.filter((item) => item.day !== day) ?? []),
			{ day, look: look.name, pieceIds: look.ids },
		];
		try {
			await savePlan(
				dayKey(monday),
				days.sort((a, b) => a.day.localeCompare(b.day)),
			);
			haptics.success();
			setNotice(`Planned for tomorrow: ${look.name}.`);
		} catch (error) {
			console.error("[fashion] could not plan", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const details = [
		["Colour", capital(piece.colour)],
		["Size · fit", [piece.size, piece.fit].filter(Boolean).join(" · ")],
		["Fabric", capital(piece.fabric)],
		["Price", piece.price !== null ? formatMoney(piece.price) : ""],
		["Care", piece.care],
	].filter(([, value]) => value);

	const setLevel = (level: number) =>
		void savePiece({ ...piece, level }).catch((error: unknown) =>
			console.error("[fashion] could not save", error),
		);

	return (
		<FashionScreen
			action={{
				icon: "Filled/Edit",
				label: "Edit piece",
				onPress: () => fashionRoutes.add({ edit: piece.id }),
			}}
		>
			<ScreenTitle
				eyebrow={`${CATEGORY_ONE[piece.category]}${boughtLabel(piece.boughtOn)}`}
				title={piece.name}
			/>
			<View
				style={[
					styles.hero,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<PieceImage
					image={piece.image}
					category={piece.category}
					colour={piece.colour}
					size={0}
					fill
					radius={24}
				/>
			</View>

			<View style={styles.stats}>
				{isScent ? (
					<>
						<Stat
							label="Left"
							value={piece.level !== null ? `${Math.round(piece.level * 100)}%` : "—"}
						/>
						<Stat label="Worn" value={`${worn}×`} />
						<Stat label="Best" value={capital(piece.scentTime ?? "day")} />
					</>
				) : (
					<>
						<Stat label="Worn" value={`${worn}×`} />
						<Stat label="Per wear" value={perWear !== null ? formatMoney(perWear) : "—"} />
						<Stat
							label="Last worn"
							value={
								since === null
									? "Not yet"
									: since === 0
										? "Today"
										: `${since} day${since === 1 ? "" : "s"}`
							}
							good={since !== null && since <= 7}
						/>
					</>
				)}
			</View>

			{isScent ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<PoText variant="title18">How full is it?</PoText>
					<View style={styles.levels}>
						{[1, 0.8, 0.6, 0.4, 0.2, 0].map((level) => {
							const on = piece.level !== null && Math.abs(piece.level - level) < 0.1;
							return (
								<Pressable
									key={level}
									accessibilityRole="radio"
									accessibilityState={{ selected: on }}
									onPress={() => setLevel(level)}
									style={[
										styles.level,
										{ backgroundColor: on ? colors.accentDefault : colors.bgSubtle },
									]}
								>
									<PoText variant="meta13" tone={on ? "textOnAccent" : "textSecondary"}>
										{Math.round(level * 100)}%
									</PoText>
								</Pressable>
							);
						})}
					</View>
				</View>
			) : shownPairs.length > 0 ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							{pairs.length > 0 ? "Pairs with" : "Goes with"}
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{pairs.length > 0 ? `${worn} looks` : `${shownPairs.length} pieces`}
						</PoText>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.pairs}
					>
						{shownPairs.slice(0, 8).map((other) => (
							<Pressable
								key={other.id}
								accessibilityRole="button"
								onPress={() => fashionRoutes.piece(other.id)}
								style={styles.pair}
							>
								<PieceImage
									image={other.image}
									category={other.category}
									colour={other.colour}
									size={76}
									radius={16}
								/>
								<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
									{other.name}
								</PoText>
							</Pressable>
						))}
					</ScrollView>
				</View>
			) : null}

			{details.length > 0 || piece.note ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					{details.map(([label, value]) => (
						<View key={label} style={styles.detail}>
							<PoText variant="text14" tone="textSecondary" style={styles.flex}>
								{label}
							</PoText>
							<PoText variant="text14">{value}</PoText>
						</View>
					))}
					{piece.note ? (
						<View style={styles.note}>
							<View style={[styles.flag, { backgroundColor: colors.statusCaution }]} />
							<PoText variant="meta13" tone="statusCaution" style={styles.flex}>
								{piece.note}
							</PoText>
						</View>
					) : null}
				</View>
			) : null}

			{notice ? (
				<View style={styles.note}>
					<Icon name="Line/Check" size={14} color={colors.textSuccess} />
					<PoText variant="meta13" tone="textSecondary">
						{notice}
					</PoText>
				</View>
			) : null}

			<Footer>
				<PillButton
					label="Plan it"
					variant="secondary"
					onPress={() => void planTomorrow()}
					style={styles.flex}
				/>
				<PillButton label="Wear today" onPress={() => void wearToday()} style={styles.flex} />
			</Footer>
		</FashionScreen>
	);
}

function Stat({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.stat,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="eyebrow11" tone="textTertiary">
				{label}
			</PoText>
			<PoText
				variant="title18"
				tone={good ? "textSuccess" : "textPrimary"}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{value}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	hero: { padding: 8, borderRadius: 32, borderWidth: 1 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 6, padding: 14, borderRadius: 20, borderWidth: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center" },
	pairs: { gap: 10 },
	pair: { width: 76, gap: 4 },
	detail: { flexDirection: "row", alignItems: "center", paddingVertical: 2 },
	note: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
	flag: { width: 8, height: 8, borderRadius: 4 },
	levels: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	level: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
});
