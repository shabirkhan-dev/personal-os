import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { usePoTheme } from "@/theme";
import { deleteEntry, updateEntry } from "../data/finance-actions";
import { useFinanceToday } from "../hooks/use-finance";
import { dayGroups, dayTitle, entryLine, inMonth, MONTHS, signed } from "../lib/finance-math";
import { CATEGORY_TONES, type Entry } from "../lib/finance-model";
import { financeRoutes } from "../navigation";
import { Card, CardHead } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";
import { EntrySheet } from "./finance-sheets";

const failed = (error: unknown) => console.error("[finance] could not change an entry", error);

/** Finance · History: every entry by day, with the day's money in minus money out. */
export function HistoryScreen() {
	const { colors } = usePoTheme();
	const { data, now } = useFinanceToday();
	const [offset, setOffset] = useState(0);
	const [open, setOpen] = useState<Entry | null>(null);
	const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
	const list = inMonth(data.entries, now, offset);
	const groups = dayGroups(list);
	const hasEarlier = data.entries.some((entry) => new Date(entry.at) < month);

	return (
		<FinanceScreen>
			<ScreenTitle
				eyebrow={`${MONTHS[month.getMonth()]} · ${list.length} ${list.length === 1 ? "entry" : "entries"}`}
				title="History"
			>
				<FilterChip label="This month" selected={offset === 0} onPress={() => setOffset(0)} />
				<FilterChip label="Last month" selected={offset === -1} onPress={() => setOffset(-1)} />
				{hasEarlier && offset <= -1 ? (
					<FilterChip
						label="Earlier"
						selected={offset < -1}
						onPress={() => setOffset(offset - 1)}
					/>
				) : null}
			</ScreenTitle>
			{groups.length === 0 ? (
				<EmptyCard
					icon="Wallet"
					title="Nothing logged here"
					body="Type what you spent on Finance's Home, like “fuel 1500”."
				/>
			) : null}
			{groups.map((group) => (
				<Card key={group.day}>
					<CardHead
						title={dayTitle(group.day, now)}
						right={`${group.net >= 0 ? "+" : "–"} ${formatMoney(Math.abs(group.net))}`}
						mono
					/>
					{group.entries.map((entry) => (
						<Pressable
							key={entry.id}
							accessibilityRole="button"
							accessibilityLabel={`${entry.title}, ${signed(entry)}`}
							onPress={() => setOpen(entry)}
							style={styles.row}
						>
							<View
								style={[
									styles.dot,
									{
										backgroundColor:
											colors[
												entry.kind === "income" ? "statusSuccess" : CATEGORY_TONES[entry.category]
											],
									},
								]}
							/>
							<View style={styles.flex}>
								<PoText variant="row15" numberOfLines={1}>
									{entry.title}
								</PoText>
								<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
									{`${entryLine(entry, now, false)} · ${entry.method === "wallet" ? "wallet" : entry.method}`}
								</PoText>
							</View>
							<PoText
								variant="row15"
								tone={entry.kind === "income" ? "textSuccess" : "textPrimary"}
							>
								{signed(entry)}
							</PoText>
						</Pressable>
					))}
				</Card>
			))}
			<EntrySheet
				entry={open}
				onClose={() => setOpen(null)}
				onSave={(entry) => {
					void updateEntry(entry)
						.then(() => haptics.success())
						.catch(failed);
					setOpen(null);
				}}
				onDelete={(entry) => {
					void deleteEntry(entry).catch(failed);
					setOpen(null);
				}}
			/>
			{groups.length === 0 && offset === 0 ? (
				<PoText variant="meta13" tone="textLink" style={styles.link} onPress={financeRoutes.log}>
					Log spending
				</PoText>
			) : null}
		</FinanceScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	link: { textAlign: "center", paddingVertical: 8 },
});
