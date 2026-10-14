import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { formatMoney } from "@/lib/money";
import { type SavingsProgress, wholeAmount } from "../lib/finance-math";

export type SavingsGoalCardProps = {
	progress: SavingsProgress | null;
	/** Opens the Savings goal sheet (set a target, add money). */
	onManage: () => void;
};

/** Figma "Widget / Stat Target": saved so far against the savings target. */
export function SavingsGoalCard({ progress, onManage }: SavingsGoalCardProps) {
	const { colors } = usePoTheme();

	return (
		<Card style={styles.card}>
			<View style={styles.head}>
				<View style={[styles.tile, { backgroundColor: colors.accentDefault }]}>
					<Icon name="Wallet" color={colors.textOnAccent} />
				</View>
				<PoText variant="body15" tone="textSecondary" style={styles.title}>
					Savings goal
				</PoText>
				{progress ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Add to savings or change the target"
						onPress={onManage}
						style={({ pressed }) => [
							styles.more,
							{
								borderColor: colors.borderDefault,
								backgroundColor: pressed ? colors.bgHover : "transparent",
							},
						]}
					>
						{[0, 1, 2].map((dot) => (
							<View key={dot} style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
						))}
					</Pressable>
				) : null}
			</View>
			{progress ? <Progress progress={progress} /> : <Empty onManage={onManage} />}
		</Card>
	);
}

function Progress({ progress }: { progress: SavingsProgress }) {
	const { colors } = usePoTheme();
	const change = progress.changePercent;
	const fillInside = progress.percent >= 18;

	return (
		<>
			<View style={styles.valueRow}>
				<View style={styles.value}>
					<PoText variant="title30" numberOfLines={1}>
						{formatMoney(progress.saved)}
					</PoText>
					{progress.addedThisMonth > 0 ? (
						<PoText variant="mono13" tone="textSuccess">
							{`+${wholeAmount(progress.addedThisMonth)}`}
						</PoText>
					) : null}
				</View>
				<View style={styles.change}>
					<PoText
						variant="mono13"
						tone={change !== null && change > 0 ? "textSuccess" : "textTertiary"}
					>
						{change === null ? "First month" : `${change > 0 ? "▲" : "–"} ${change}%`}
					</PoText>
					<PoText variant="meta13" tone="textTertiary">
						{change === null ? "no saving before" : "vs last month"}
					</PoText>
				</View>
			</View>
			<View style={[styles.rule, { borderColor: colors.borderDefault }]} />
			<View style={styles.target}>
				<PoText variant="body15" tone="textTertiary">
					{`Target ${formatMoney(progress.target)}`}
				</PoText>
				<View style={styles.legend}>
					<View style={styles.legendItem}>
						<View style={[styles.square, { backgroundColor: colors.accentDefault }]} />
						<PoText variant="meta13" tone="textSecondary">
							Saved
						</PoText>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.square, { backgroundColor: colors.bgSubtle }]} />
						<PoText variant="meta13" tone="textSecondary">
							Left
						</PoText>
					</View>
				</View>
			</View>
			<View
				accessible
				accessibilityRole="progressbar"
				accessibilityValue={{ min: 0, max: 100, now: progress.percent }}
				style={[styles.track, { backgroundColor: colors.bgSubtle }]}
			>
				{progress.percent > 0 ? (
					<View
						style={[
							styles.fill,
							{ width: `${progress.percent}%`, backgroundColor: colors.accentDefault },
						]}
					>
						{fillInside ? (
							<PoText variant="meta13" tone="textOnAccent">
								{`${progress.percent}%`}
							</PoText>
						) : null}
					</View>
				) : null}
				{fillInside ? null : (
					<PoText variant="meta13" tone="textSecondary" style={styles.outside}>
						{`${progress.percent}%`}
					</PoText>
				)}
				<View style={styles.spacer} />
				{progress.percent < 92 ? (
					<PoText variant="meta13" tone="textTertiary">
						100%
					</PoText>
				) : null}
			</View>
		</>
	);
}

function Empty({ onManage }: { onManage: () => void }) {
	return (
		<View style={styles.empty}>
			<PoText variant="meta13" tone="textTertiary">
				No savings goal yet. Pick a target and add money as you save.
			</PoText>
			<PillButton label="Set a savings goal" variant="secondary" showPlus onPress={onManage} />
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	head: { flexDirection: "row", alignItems: "center", gap: 12 },
	tile: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	title: { flex: 1 },
	more: {
		width: 36,
		height: 36,
		borderRadius: 18,
		borderWidth: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	dot: { width: 3, height: 3, borderRadius: 1.5 },
	valueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	value: { flexDirection: "row", alignItems: "baseline", gap: 8, flexShrink: 1 },
	change: { alignItems: "flex-end", gap: 2 },
	rule: { borderTopWidth: 1, borderStyle: "dashed" },
	target: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	legend: { flexDirection: "row", gap: 14 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	square: { width: 12, height: 12, borderRadius: 3 },
	track: {
		height: 30,
		borderRadius: 15,
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 12,
		overflow: "hidden",
	},
	fill: { height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
	outside: { marginLeft: 10 },
	spacer: { flex: 1 },
	empty: { gap: 14 },
});
