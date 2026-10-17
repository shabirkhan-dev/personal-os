import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip } from "@/components/module-ui";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { monthShort } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { markGot, reorder, saveSettings } from "../data/wishlist-actions";
import { useWishlistToday } from "../hooks/use-wishlist";
import { useWishlistUi } from "../hooks/wishlist-ui-store";
import {
	compactMoney,
	type InsightRange,
	recap,
	type WishlistNote,
	wishlistNotes,
} from "../lib/wishlist-math";
import { wishlistRoutes } from "../navigation";
import { WishlistScreen } from "./wishlist-screen";

const RANGES: ReadonlyArray<{ value: InsightRange; label: string }> = [
	{ value: "month", label: "This month" },
	{ value: "last", label: "Last month" },
	{ value: "year", label: "Year" },
];

/** Wishlist Insights: the recap for a range, three numbers, and what the list itself shows. */
export function WishlistInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now } = useWishlistToday();
	const { dreams, settings, loading } = data;
	const hidden = useWishlistUi((state) => state.hidden);
	const hide = useWishlistUi((state) => state.hide);
	const [range, setRange] = useState<InsightRange>("month");
	const [notice, setNotice] = useState<string | null>(null);

	const summary = useMemo(
		() => recap(dreams, settings, range, now),
		[dreams, settings, range, now],
	);
	const notes = useMemo(
		() =>
			wishlistNotes(dreams, settings, range, now).filter((note) => !hidden.includes(noteKey(note))),
		[dreams, settings, range, now, hidden],
	);

	const period =
		range === "year"
			? String(now.getFullYear())
			: monthShort(range === "last" ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now);

	const act = (work: Promise<unknown>, done: string, note: WishlistNote) => {
		work
			.then(() => {
				haptics.success();
				setNotice(done);
				hide(noteKey(note));
			})
			.catch((error: unknown) => {
				console.error("[wishlist] could not save", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<WishlistScreen
			insightsActive
			action={{ icon: "Filled/Calendar", label: "Roadmap", onPress: wishlistRoutes.roadmap }}
		>
			<View style={styles.ranges}>
				{RANGES.map((item) => (
					<FilterChip
						key={item.value}
						label={item.label}
						selected={range === item.value}
						onPress={() => setRange(item.value)}
					/>
				))}
			</View>

			{loading ? (
				<ActivityIndicator color={colors.accentDefault} />
			) : dreams.length === 0 ? (
				<EmptyCard
					icon="Filled/Chart"
					title="Nothing on the list yet"
					body="Add a dream and this fills in: what you added, saved and bought, always in cash."
				>
					<PillButton label="Add a dream" onPress={() => wishlistRoutes.add()} />
				</EmptyCard>
			) : (
				<>
					<View style={styles.recap}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{`${range === "year" ? "Yearly" : "Monthly"} recap · ${period}`}
							</PoText>
						</View>
						<PoText variant="title18" tone="textSecondary">
							{summary.bought === 0 ? (
								<PoText variant="title18">Nothing bought</PoText>
							) : (
								<PoText variant="title18">{`${summary.bought} bought with cash`}</PoText>
							)}
							{" and "}
							<PoText variant="title18">nothing borrowed</PoText>
							{". "}
							{summary.added === 0
								? "No new dreams"
								: `${summary.added} ${summary.added === 1 ? "dream" : "dreams"} added`}
							{summary.added > 0
								? summary.addedPassedCoolOff === summary.added
									? `, and ${summary.added === 1 ? "it" : summary.added === 2 ? "both" : "all"} passed the `
									: `, ${summary.addedPassedCoolOff} past the `
								: ", "}
							{summary.added > 0 ? (
								<PoText variant="title18">{`${settings.coolOffDays}-day cool-off`}</PoText>
							) : (
								"so the list held steady"
							)}
							{"."}
							{summary.saved > 0 ? ` ${compactMoney(summary.saved)} put aside.` : ""}
						</PoText>
					</View>

					<View style={styles.stats}>
						<Stat
							label="Dreams"
							value={String(summary.open)}
							foot={summary.added > 0 ? `▲ ${summary.added}` : "steady"}
							footTone={summary.added > 0 ? "textSuccess" : "textTertiary"}
						/>
						<Stat
							label="Spent"
							value={compactMoney(summary.spent)}
							foot={summary.bought > 0 ? "cash" : "on hold"}
							footTone="textSuccess"
						/>
						<Stat label="Interest" value="Rs 0" foot="always" footTone="textSuccess" />
					</View>
				</>
			)}

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.notice}>
					What I noticed
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note, settings.coolOffDays);
				return (
					<Card key={noteKey(note)}>
						<View style={styles.eyebrow}>
							<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
							<PoText variant="eyebrow11" tone="textTertiary">
								{text.title}
							</PoText>
						</View>
						<PoText variant="body15" tone="textSecondary">
							{text.body}
						</PoText>
						<View style={styles.actions}>
							<PillButton
								label={text.primary}
								style={styles.flex}
								onPress={() => {
									if (note.kind === "pays-first") {
										if (note.first) hide(noteKey(note));
										else
											act(
												reorder(dreams, note.dream.id, 0),
												`${note.dream.name} is first now.`,
												note,
											);
									} else if (note.kind === "ready") {
										act(markGot(note.dream, dreams), `${note.dream.name} marked as got.`, note);
									} else if (note.kind === "stalled") {
										wishlistRoutes.dream(note.dream.id, true);
									} else {
										hide(noteKey(note));
									}
								}}
							/>
							<PillButton
								label={text.secondary}
								variant="secondary"
								onPress={() => {
									if (note.kind === "pays-first" && note.first) wishlistRoutes.roadmap();
									else if (note.kind === "late-night")
										act(
											saveSettings({ ...settings, coolOffDays: settings.coolOffDays * 2 }),
											`Cool-off is ${settings.coolOffDays * 2} days now.`,
											note,
										);
									else hide(noteKey(note));
								}}
							/>
						</View>
					</Card>
				);
			})}
		</WishlistScreen>
	);
}

function noteKey(note: WishlistNote): string {
	return "dream" in note ? `${note.kind}:${note.dream.id}` : note.kind;
}

function noteText(note: WishlistNote, coolOffDays: number) {
	switch (note.kind) {
		case "pays-first":
			return note.first
				? {
						title: `${note.dream.name} first`,
						body: `${note.dream.name} pays back fastest: it's the tool you earn with, so it stays first in line.`,
						primary: "Keep it first",
						secondary: "Reorder",
					}
				: {
						title: "Pays for itself",
						body: `${note.dream.name} earns its price back. Moving it first gets the rest sooner.`,
						primary: "Move it first",
						secondary: "Later",
					};
		case "ready":
			return {
				title: "Ready to buy",
				body: `${note.dream.name} is fully saved and past the cool-off. Buy it with cash when you're ready.`,
				primary: "Mark as got",
				secondary: "Wait",
			};
		case "stalled":
			return {
				title: "Saving paused",
				body: `Nothing went to ${note.dream.name} in ${note.days} days. Even a small amount keeps it moving.`,
				primary: "Add savings",
				secondary: "Later",
			};
		case "late-night":
			return {
				title: "Late-night adds",
				body: `${note.count} ${note.count === 1 ? "dream was" : "dreams were"} added after midnight. The cool-off is doing its job, so keep it on.`,
				primary: `Keep ${coolOffDays} days`,
				secondary: `Make it ${coolOffDays * 2}`,
			};
	}
}

function Stat({
	label,
	value,
	foot,
	footTone,
}: {
	label: string;
	value: string;
	foot: string;
	footTone: "textSuccess" | "textTertiary";
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.stat,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<PoText variant="title18">{value}</PoText>
			<PoText variant="mono13" tone={footTone}>
				{foot}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { flexDirection: "row", gap: 8 },
	recap: { gap: 8, paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	stat: { flex: 1, gap: 4, padding: 14, borderRadius: 24, borderWidth: 1 },
	notice: { paddingHorizontal: 6 },
	actions: { flexDirection: "row", gap: 8 },
});
