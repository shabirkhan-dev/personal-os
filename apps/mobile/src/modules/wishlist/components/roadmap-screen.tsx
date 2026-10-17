import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { usePoTheme } from "@/theme";
import { saveSettings } from "../data/wishlist-actions";
import { useWishlistToday } from "../hooks/use-wishlist";
import { compactMoney, fullMoney, type RoadmapStop, whenLabel } from "../lib/wishlist-math";
import { SAVE_SHARES } from "../lib/wishlist-model";
import { wishlistRoutes } from "../navigation";
import { DreamImage } from "./dream-image";
import { WishlistScreen } from "./wishlist-screen";

const SOON_DAYS = 548;

type Group = { when: string; days: number | null; stops: RoadmapStop[] };

/** Dreams that unlock in the same period share one stop: "Watch and boxing kit". */
function grouped(stops: readonly RoadmapStop[], now: Date): Group[] {
	const groups: Group[] = [];
	for (const stop of stops) {
		const when = stop.ready ? whenLabel(stop.ready, now) : "Someday";
		const last = groups.at(-1);
		if (last && last.when === when) last.stops.push(stop);
		else groups.push({ when, days: stop.days, stops: [stop] });
	}
	return groups;
}

/** Roadmap: when each dream unlocks if a share of income goes to them, one at a time. */
export function RoadmapScreen() {
	const { colors } = usePoTheme();
	const { data, funding, stops, income, monthly, now } = useWishlistToday();
	const { settings } = data;
	const [planned, setPlanned] = useState("");
	const groups = useMemo(() => grouped(stops, now), [stops, now]);

	const setShare = (share: number) =>
		void saveSettings({ ...settings, saveShare: share }).catch((error: unknown) =>
			console.error("[wishlist] could not save the share", error),
		);
	const plannedValue = parseAmount(planned);

	return (
		<WishlistScreen>
			<ScreenTitle eyebrow="When each dream unlocks" title="Roadmap" />

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{income > 0
						? `If you earn ${compactMoney(income)} a month and save`
						: "What do you earn a month?"}
				</PoText>
				{income > 0 ? (
					<>
						<View style={styles.shares}>
							{SAVE_SHARES.map((share) => (
								<FilterChip
									key={share}
									label={`${Math.round(share * 100)}%`}
									selected={Math.abs(settings.saveShare - share) < 0.001}
									onPress={() => setShare(share)}
								/>
							))}
						</View>
						<PoText variant="meta13" tone="textSecondary">
							{`${fullMoney(monthly)} a month into dreams${
								funding.incomeExpected ? ", starting with the first salary" : ""
							}.`}
						</PoText>
						{funding.income <= 0 ? (
							<Pressable
								accessibilityRole="button"
								onPress={() =>
									void saveSettings({ ...settings, plannedIncome: 0 }).catch((error: unknown) =>
										console.error("[wishlist] could not clear income", error),
									)
								}
							>
								<PoText variant="meta13" tone="accentDefault">
									Planned income · change
								</PoText>
							</Pressable>
						) : null}
					</>
				) : (
					<>
						<TextField
							label="Monthly income, or what you expect to earn"
							value={planned}
							onChangeText={setPlanned}
							keyboardType="decimal-pad"
							suffix="Rs"
							placeholder="350,000"
						/>
						<PillButton
							label="Plan with this"
							disabled={plannedValue === null}
							onPress={() => {
								if (plannedValue === null) return;
								haptics.success();
								void saveSettings({ ...settings, plannedIncome: plannedValue }).catch(
									(error: unknown) => console.error("[wishlist] could not save income", error),
								);
							}}
						/>
						<PoText variant="meta13" tone="textTertiary">
							Finance's income is used once it's set there.
						</PoText>
					</>
				)}
			</View>

			{data.loading ? (
				<ActivityIndicator color={colors.accentDefault} />
			) : groups.length === 0 ? (
				<EmptyCard
					icon="List"
					title="Nothing to plan yet"
					body="Add a dream and the roadmap shows when each one unlocks, paid in cash."
				>
					<PillButton label="Add a dream" onPress={() => wishlistRoutes.add()} />
				</EmptyCard>
			) : (
				<View style={[styles.card, styles.timeline, { backgroundColor: colors.bgSurface }]}>
					{groups.map((group, index) => (
						<Stop
							key={group.stops[0]?.dream.id ?? group.when}
							group={group}
							first={index === 0}
							last={index === groups.length - 1}
						/>
					))}
				</View>
			)}
		</WishlistScreen>
	);
}

function Stop({ group, first, last }: { group: Group; first: boolean; last: boolean }) {
	const { colors } = usePoTheme();
	const soon = group.days !== null && group.days <= SOON_DAYS;
	const tone = soon ? colors.accentDefault : colors.textTertiary;
	const names = group.stops.map((stop) => stop.dream.name);
	const title =
		names.length <= 2
			? names.join(" and ")
			: `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
	const price = group.stops.reduce((sum, stop) => sum + stop.dream.price, 0);
	return (
		<View style={styles.stop}>
			<View style={styles.rail}>
				<View
					style={[
						styles.dot,
						first ? { backgroundColor: tone, borderColor: tone } : { borderColor: tone },
					]}
				/>
				{last ? null : <View style={[styles.line, { backgroundColor: colors.borderDefault }]} />}
			</View>
			<View style={styles.stopText}>
				<PoText variant="mono13" tone={soon ? "accentDefault" : "textTertiary"}>
					{group.when}
				</PoText>
				<View style={styles.stopHead}>
					<PoText variant="row15" style={styles.flex} numberOfLines={2}>
						{title}
					</PoText>
					<PoText variant="mono13" tone="textTertiary">
						{compactMoney(price)}
					</PoText>
				</View>
				<View style={styles.thumbs}>
					{group.stops.map((stop) => (
						<Pressable
							key={stop.dream.id}
							accessibilityRole="button"
							accessibilityLabel={stop.dream.name}
							onPress={() => {
								haptics.tap();
								wishlistRoutes.dream(stop.dream.id);
							}}
						>
							<DreamImage
								photo={stop.dream.photo}
								category={stop.dream.category}
								width={72}
								height={52}
								radius={12}
							/>
						</Pressable>
					))}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 16, borderRadius: 28 },
	shares: { flexDirection: "row", gap: 6 },
	timeline: { gap: 0 },
	stop: { flexDirection: "row", gap: 14 },
	rail: { width: 14, alignItems: "center" },
	dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
	line: { flex: 1, width: 2, borderRadius: 1 },
	stopText: { flex: 1, gap: 6, paddingBottom: 18 },
	stopHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	thumbs: { flexDirection: "row", gap: 6 },
});
