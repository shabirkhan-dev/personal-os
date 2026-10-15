import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { EmptyCard, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { saveWish } from "../data/fashion-actions";
import { useFashionToday } from "../hooks/use-fashion-today";
import { capital, wornStreak } from "../lib/fashion-math";
import { pickScent, sprays } from "../lib/outfits";
import { condition } from "../lib/weather";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";
import { PieceImage } from "./piece-image";

/** Watches & scents: the watch box with today's pick, the day's scent tip and the scent shelf. */
export function WatchesScreen() {
	const { colors } = usePoTheme();
	const { data, weather, now, context, looks, worn } = useFashionToday();
	const watches = data.pieces.filter((piece) => piece.category === "watch");
	const scents = data.pieces.filter((piece) => piece.category === "scent");
	const wishedWatches = data.wishes.filter((wish) => wish.category === "watch");
	const todayIds = new Set(
		worn?.pieceIds ?? (looks[0] ? [looks[0].watch?.id, looks[0].scent?.id].filter(Boolean) : []),
	);
	const onWrist = watches.find((watch) => todayIds.has(watch.id)) ?? looks[0]?.watch ?? null;
	const streakWatch = watches
		.map((watch) => ({ watch, streak: wornStreak(watch.id, data.wears, now) }))
		.sort((a, b) => b.streak - a.streak)[0];
	const dayScent = pickScent(scents, { weather: context.weather, evening: false });
	const eveningScent = pickScent(scents, { weather: context.weather, evening: true });
	const daily = weather.forecast?.days.find((item) => item.day === context.day);
	const low = [...scents]
		.filter((piece) => piece.level !== null && piece.level < 0.4)
		.sort((a, b) => (a.level ?? 0) - (b.level ?? 0))[0];

	if (!data.loading && watches.length === 0 && scents.length === 0) {
		return (
			<FashionScreen>
				<ScreenTitle eyebrow="Finishing touches" title="Watches & scents" />
				<EmptyCard
					icon="Clock"
					title="No watches or scents yet"
					body="Add them and I'll rotate the watch and pick a scent for the weather and time of day."
				>
					<PillButton
						label="Add a watch"
						onPress={() => fashionRoutes.add({ category: "watch" })}
					/>
					<PillButton
						label="Add a scent"
						variant="ghost"
						onPress={() => fashionRoutes.add({ category: "scent" })}
					/>
				</EmptyCard>
			</FashionScreen>
		);
	}

	return (
		<FashionScreen
			action={{
				icon: "Line/Plus",
				label: "Add a watch or scent",
				onPress: () => fashionRoutes.add({ category: "watch" }),
			}}
		>
			<ScreenTitle eyebrow="Finishing touches" title="Watches & scents" />

			{watches.length > 0 ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							Watch box
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{watches.length}
							{wishedWatches.length > 0 ? ` + ${wishedWatches.length} wished` : ""}
						</PoText>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.row}
					>
						{watches.map((watch) => {
							const on = watch.id === onWrist?.id;
							return (
								<Pressable
									key={watch.id}
									accessibilityRole="button"
									onPress={() => fashionRoutes.piece(watch.id)}
									style={styles.item}
								>
									<View
										style={[
											styles.frame,
											{ borderColor: on ? colors.accentDefault : "transparent" },
										]}
									>
										<PieceImage
											image={watch.image}
											category="watch"
											colour={watch.colour}
											size={96}
											radius={18}
										/>
									</View>
									<PoText variant="row15">{watch.name.replace(/\s*watch$/i, "")}</PoText>
									<PoText variant="meta13" tone={on ? "accentDefault" : "textTertiary"}>
										{on ? (worn ? "On wrist today" : "Today's pick") : "Resting"}
									</PoText>
								</Pressable>
							);
						})}
						{wishedWatches.map((wish) => (
							<Pressable
								key={wish.id}
								accessibilityRole="button"
								onPress={fashionRoutes.wishlist}
								style={[styles.item, styles.dim]}
							>
								<PieceImage
									image={wish.image}
									category="watch"
									colour={wish.colour}
									size={96}
									radius={18}
								/>
								<PoText variant="row15" tone="textSecondary">
									{wish.name.replace(/\s*watch$/i, "")}
								</PoText>
								<PoText variant="meta13" tone="textTertiary">
									Wishlist
								</PoText>
							</Pressable>
						))}
					</ScrollView>
					{streakWatch && streakWatch.streak >= 3 ? (
						<View style={styles.note}>
							<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
							<PoText variant="meta13" tone="textSecondary">
								{streakWatch.watch.name} ran {streakWatch.streak} days straight · give it a rest
								tomorrow
							</PoText>
						</View>
					) : null}
				</View>
			) : null}

			{dayScent ? (
				<View style={[styles.tip, { backgroundColor: colors.accentSubtle }]}>
					<PoText variant="eyebrow11" tone="accentDefault">
						Today
						{daily && weather.forecast
							? ` · ${Math.round(weather.forecast.now.temp)}° and ${condition(daily.code)}`
							: ""}
					</PoText>
					<PoText variant="row15">
						{dayScent.name}, {sprays(dayScent, context.weather)} spray
						{sprays(dayScent, context.weather) === 1 ? "" : "s"} on the neck
					</PoText>
					{eveningScent && eveningScent.id !== dayScent.id ? (
						<PoText variant="meta13" tone="textSecondary">
							Switch to {eveningScent.name} in the evening, 1 spray. Nothing before training.
						</PoText>
					) : (
						<PoText variant="meta13" tone="textSecondary">
							Light in the heat; skip it before training.
						</PoText>
					)}
				</View>
			) : null}

			{scents.length > 0 ? (
				<View
					style={[
						styles.card,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							Scent shelf
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{scents.length} bottle{scents.length === 1 ? "" : "s"}
						</PoText>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.row}
					>
						{scents.map((scent) => {
							const level = scent.level ?? 1;
							const lowLevel = level < 0.4;
							return (
								<Pressable
									key={scent.id}
									accessibilityRole="button"
									onPress={() => fashionRoutes.piece(scent.id)}
									style={styles.item}
								>
									<PieceImage
										image={scent.image}
										category="scent"
										colour={scent.colour}
										size={96}
										radius={18}
									/>
									<PoText variant="row15">{scent.name}</PoText>
									<PoText variant="meta13" tone="textTertiary">
										{capital(scent.scentTime ?? "day")}
									</PoText>
									<ProgressBar share={level} tone={lowLevel ? "statusCaution" : "statusSuccess"} />
									<PoText variant="mono13" tone={lowLevel ? "statusCaution" : "textSecondary"}>
										{Math.round(level * 100)}% left
									</PoText>
								</Pressable>
							);
						})}
					</ScrollView>
				</View>
			) : null}

			{low ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => {
						if (data.settings.buyingPaused) return;
						haptics.tap();
						void saveWish({
							name: `${low.name} refill`,
							category: "scent",
							colour: low.colour,
							price: low.price,
							tag: "replace",
							reason: `Down to ${Math.round((low.level ?? 0) * 100)}%.`,
							unlock: "",
							image: low.image,
							url: "",
						})
							.then(fashionRoutes.wishlist)
							.catch((error: unknown) =>
								console.error("[fashion] could not add the refill", error),
							);
					}}
					style={[
						styles.low,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<PieceImage
						image={low.image}
						category="scent"
						colour={low.colour}
						size={44}
						radius={12}
					/>
					<View style={styles.flex}>
						<PoText variant="row15">
							{low.name} · {Math.round((low.level ?? 0) * 100)}% left
						</PoText>
						<PoText variant="meta13" tone="statusCaution">
							{data.settings.buyingPaused
								? "Refill once income starts"
								: "Tap to add a refill to the wishlist"}
						</PoText>
					</View>
				</Pressable>
			) : null}
		</FashionScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 14, padding: 16, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center" },
	row: { gap: 10 },
	item: { width: 100, gap: 4 },
	dim: { opacity: 0.6 },
	frame: { borderWidth: 2, borderRadius: 20, padding: 0 },
	note: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	tip: { gap: 6, padding: 18, borderRadius: 24 },
	low: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
});
