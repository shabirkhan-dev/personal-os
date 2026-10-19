import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, Footer, ListRow, MetaChip, ScreenTitle } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { deleteDream, markGot, startSaving, toggleCheck } from "../data/wishlist-actions";
import { useDreamSavings } from "../hooks/use-dream-savings";
import { useWishlistToday } from "../hooks/use-wishlist";
import {
	amountLeft,
	compactMoney,
	coolOff,
	fullMoney,
	monthsFor,
	progress,
	progressPercent,
	whenLabel,
} from "../lib/wishlist-math";
import { CATEGORY_LABELS, type Contribution } from "../lib/wishlist-model";
import { wishlistRoutes } from "../navigation";
import { DreamImage } from "./dream-image";
import { SavedBar } from "./home-cards";
import { SavingsSheet } from "./savings-sheet";
import { WishlistScreen } from "./wishlist-screen";

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** One dream: photo, price and cool-off, why, the halal plan, before-you-buy and savings. */
export function DreamDetailScreen({ id, openSave = false }: { id: string; openSave?: boolean }) {
	const { colors } = usePoTheme();
	const { data, stops, monthly, now } = useWishlistToday();
	const savings = useDreamSavings();
	const [saveOpen, setSaveOpen] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const { dreams, owned, settings } = data;
	const dream = dreams.find((item) => item.id === id);
	const stop = stops.find((item) => item.dream.id === id) ?? null;

	// The Home header's "save for up next" lands here with the sheet open.
	useEffect(() => {
		if (openSave && dream) setSaveOpen(true);
		// oxlint-disable-next-line react/exhaustive-deps -- only on arrival
	}, [openSave, Boolean(dream)]);

	const sibling = useMemo(
		() =>
			dream
				? dreams.find(
						(item) =>
							item.id !== dream.id && item.category === dream.category && item.status !== "got",
					)
				: undefined,
		[dreams, dream],
	);

	if (!dream) {
		return (
			<WishlistScreen>
				{data.loading ? (
					<ActivityIndicator color={colors.accentDefault} />
				) : (
					<EmptyCard
						icon="Star"
						title="Not on your list"
						body="This dream was removed or hasn't synced to this phone yet."
					>
						<PillButton label="Back to Wishlist" onPress={wishlistRoutes.today} />
					</EmptyCard>
				)}
			</WishlistScreen>
		);
	}

	const wait = coolOff(dream, settings, now);
	const left = amountLeft(dream);
	const vehicle = owned.find((item) => item.kind === "vehicle" && item.resale);
	const sale = dream.category === "bikes" || dream.category === "cars" ? vehicle : undefined;
	const toSave = Math.max(0, left - (sale?.resale ?? 0));
	const months = monthsFor(toSave, monthly);
	const got = dream.status === "got";
	const ready = left === 0 && wait.passed && dream.price > 0;
	const checks = [
		{
			id: "cool-off",
			label: `${settings.coolOffDays} days on the list`,
			done: wait.passed,
			auto: true,
		},
		...dream.checklist.map((item) => ({ ...item, auto: false })),
	];
	const checked = checks.filter((item) => item.done).length;
	const when = stop?.ready ? whenLabel(stop.ready, now) : null;
	const eyebrow = [
		CATEGORY_LABELS[dream.category],
		got ? "got it" : dream.status === "saving" ? "saving" : when ? when : "someday",
		`on the list ${wait.days} ${wait.days === 1 ? "day" : "days"}`,
	].join(" · ");

	const run = (work: () => Promise<unknown>, done?: string) => {
		setBusy(true);
		work()
			.then(() => {
				haptics.success();
				if (done) setNotice(done);
			})
			.catch((error: unknown) => {
				console.error("[wishlist] could not save", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
			.finally(() => setBusy(false));
	};

	const undo = (contribution: Contribution) =>
		Alert.alert(
			`Undo ${fullMoney(contribution.amount)}?`,
			"It goes back to the budget line it came from in Finance.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: "Undo",
					style: "destructive",
					onPress: () =>
						run(
							() => savings.undo(dream, contribution),
							`${fullMoney(contribution.amount)} put back.`,
						),
				},
			],
		);

	const remove = () =>
		Alert.alert(
			`Remove ${dream.name}?`,
			dream.savedAmount > 0
				? `The ${fullMoney(dream.savedAmount)} saved for it goes back to your budget in Finance.`
				: "It leaves your list.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: () =>
						run(async () => {
							await savings.undoAll(dream);
							await deleteDream(dream, dreams);
							router.back();
						}),
				},
			],
		);

	const buy = () =>
		Alert.alert(
			`Bought ${dream.name}?`,
			`Paid ${fullMoney(dream.price)} in cash. ${
				dream.category === "trips" ? "" : "It moves to your garage so you can look after it."
			}`,
			[
				{ text: "Not yet", style: "cancel" },
				{
					text: "Got it",
					onPress: () => run(() => markGot(dream, dreams), "Enjoy it. Marked as got."),
				},
			],
		);

	const primary = got
		? null
		: ready
			? { label: "Got it", onPress: buy }
			: dream.status === "saving"
				? { label: "Add savings", onPress: () => setSaveOpen(true) }
				: {
						label: "Start saving",
						onPress: () =>
							run(() => startSaving(dream, dreams), `${dream.name} is first in line now.`),
					};

	return (
		<WishlistScreen
			action={{
				icon: "Filled/Edit",
				label: "Edit dream",
				onPress: () => wishlistRoutes.add(dream.id),
			}}
		>
			<ScreenTitle eyebrow={eyebrow} title={dream.name}>
				{sibling ? (
					<MetaChip
						icon="Layers"
						label={`Compare with ${sibling.name}`}
						onPress={() => wishlistRoutes.compare(dream.id, sibling.id)}
					/>
				) : null}
			</ScreenTitle>
			<DreamImage photo={dream.photo} category={dream.category} height={230} radius={24} />
			<View style={styles.priceRow}>
				<PoText variant="title30" style={styles.flex} numberOfLines={1} adjustsFontSizeToFit>
					{fullMoney(dream.price)}
				</PoText>
				<View
					style={[
						styles.tag,
						{ backgroundColor: wait.passed ? colors.statusSuccessSubtle : colors.bgSubtle },
					]}
				>
					<PoText variant="meta13" tone={wait.passed ? "textSuccess" : "textSecondary"}>
						{got
							? "Got it"
							: wait.passed
								? "Cool-off passed"
								: `${wait.daysLeft} ${wait.daysLeft === 1 ? "day" : "days"} to wait`}
					</PoText>
				</View>
			</View>

			{dream.notes ? (
				<View style={[styles.box, { backgroundColor: colors.accentSubtle }]}>
					<PoText variant="eyebrow11" tone="accentDefault">
						Why I want it
					</PoText>
					<PoText variant="body15">{dream.notes}</PoText>
				</View>
			) : null}

			<View style={[styles.box, styles.plan, { backgroundColor: colors.bgSubtle }]}>
				<View style={styles.head}>
					<PoText variant="title18" style={styles.flex}>
						Halal plan
					</PoText>
					<PoText variant="mono13" tone="textSuccess">
						cash only
					</PoText>
				</View>
				{sale?.resale ? (
					<PlanRow label={`Sell the ${sale.name}`} value={`≈ ${fullMoney(sale.resale)}`} />
				) : null}
				<PlanRow
					label="Save each month"
					value={monthly > 0 ? fullMoney(monthly) : "Set income in Roadmap"}
					onPress={monthly > 0 ? undefined : wishlistRoutes.roadmap}
				/>
				<PlanRow label="Months to go" value={months === null ? "–" : String(months)} />
				<PlanRow
					label="Ready around"
					value={got ? "Bought" : left === 0 ? "Now" : (when ?? "–")}
					tone="accentDefault"
				/>
				<View style={styles.saved}>
					<SavedBar share={progress(dream)} />
					<PoText variant="meta13" tone="textTertiary">
						{dream.savedAmount > 0
							? `${fullMoney(dream.savedAmount)} saved · ${progressPercent(dream)}% of ${compactMoney(dream.price)}`
							: stop?.after
								? `Rs 0 saved · starts after the ${stop.after.name}`
								: "Rs 0 saved so far"}
					</PoText>
				</View>
			</View>

			<View style={[styles.box, styles.plan, { backgroundColor: colors.bgSubtle }]}>
				<View style={styles.head}>
					<PoText variant="title18" style={styles.flex}>
						Before you buy
					</PoText>
					<PoText variant="mono13" tone="textTertiary">
						{`${checked} of ${checks.length}`}
					</PoText>
				</View>
				{checks.map((item) => (
					<Pressable
						key={item.id}
						accessibilityRole="checkbox"
						accessibilityState={{ checked: item.done, disabled: item.auto }}
						disabled={item.auto}
						onPress={() => {
							haptics.select();
							void toggleCheck(dream, item.id).catch((error: unknown) =>
								console.error("[wishlist] could not tick", error),
							);
						}}
						style={styles.check}
					>
						<Checkbox checked={item.done} size={24} />
						<PoText variant="row15" tone={item.done ? "textTertiary" : "textPrimary"}>
							{item.label}
						</PoText>
					</Pressable>
				))}
			</View>

			{dream.contributions.length > 0 ? (
				<View style={[styles.box, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="title18">Saved so far</PoText>
					{[...dream.contributions]
						.sort((a, b) => b.at.localeCompare(a.at))
						.slice(0, 6)
						.map((item, index, list) => (
							<ListRow
								key={item.id}
								title={fullMoney(item.amount)}
								subtitle={`${SHORT_DATE.format(new Date(item.at))} · from Finance`}
								action={{ label: "Undo", onPress: () => undo(item) }}
								last={index === list.length - 1}
							/>
						))}
				</View>
			) : null}

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					variant="secondary"
					label={got ? "Remove" : "Edit"}
					style={styles.flex}
					onPress={got ? remove : () => wishlistRoutes.add(dream.id)}
				/>
				{primary ? (
					<PillButton
						label={primary.label}
						style={styles.flex}
						disabled={busy}
						onPress={primary.onPress}
					/>
				) : null}
			</Footer>
			{got ? null : <PillButton variant="ghost" label="Remove from list" onPress={remove} />}
			<SavingsSheet
				dream={dream}
				visible={saveOpen}
				onClose={() => setSaveOpen(false)}
				onSaved={setNotice}
			/>
		</WishlistScreen>
	);
}

function PlanRow({
	label,
	value,
	tone = "textPrimary",
	onPress,
}: {
	label: string;
	value: string;
	tone?: "textPrimary" | "accentDefault";
	onPress?: () => void;
}) {
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={onPress}
			style={styles.planRow}
		>
			<PoText variant="meta13" tone="textTertiary" style={styles.flex}>
				{label}
			</PoText>
			<PoText variant="row15" tone={onPress ? "accentDefault" : tone}>
				{value}
			</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
	box: { gap: 6, padding: 16, borderRadius: 24 },
	plan: { gap: 4 },
	head: { flexDirection: "row", alignItems: "center" },
	planRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
	saved: { gap: 6, paddingTop: 8 },
	check: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 7 },
	notice: { paddingHorizontal: 6 },
});
