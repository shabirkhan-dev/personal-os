import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { saveSettings, updateNumbers } from "../data/finance-actions";
import { useFinanceToday } from "../hooks/use-finance";
import {
	balanceTone,
	longDate,
	MONTHS,
	minimumTotal,
	project,
	rupees,
	type Scenario,
	shortDate,
	shortK,
} from "../lib/finance-math";
import type { MinimumItem } from "../lib/finance-model";
import { ButtonPair, Card, CardHead, BalanceRow, Eyebrow } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";
import { NumbersSheet } from "./finance-sheets";

type WhatIf = "now" | "job-soon" | "job-later" | "cut";
const CUT = 10_000;

/** Finance · Runway: how long the money lasts, what-ifs, and the minimum that's always paid. */
export function RunwayScreen() {
	const { data, now, balance, days, burn } = useFinanceToday();
	const { settings } = data;
	const [whatIf, setWhatIf] = useState<WhatIf>("now");
	const [editing, setEditing] = useState(false);
	const [minimum, setMinimum] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const soon = new Date(now.getFullYear(), now.getMonth() + 2, 1);
	const later = new Date(now.getFullYear(), now.getMonth() + 4, 1);
	const scenario: Scenario =
		whatIf === "job-soon"
			? { jobFrom: soon, cut: 0 }
			: whatIf === "job-later"
				? { jobFrom: later, cut: 0 }
				: whatIf === "cut"
					? { jobFrom: null, cut: CUT }
					: { jobFrom: null, cut: 0 };
	const projection = project(balance, settings, now, scenario, 4);
	const out = projection.runsOut;
	const points = projection.points.filter((point) => !out || point.at < out);
	const max = Math.max(1, ...points.map((point) => point.balance));
	const essentials = minimumTotal(settings);

	const failed = (error: unknown) => {
		console.error("[finance] could not save", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const message = out
		? `At this pace money runs out around ${longDate(out)}.`
		: scenario.jobFrom
			? `With a job from ${longDate(scenario.jobFrom)}, the money doesn't run out.`
			: "Income covers the month, so the money doesn't run out.";

	return (
		<FinanceScreen
			action={{ icon: "Filled/Edit", label: "Edit numbers", onPress: () => setEditing(true) }}
		>
			<ScreenTitle
				eyebrow={`${rupees(balance)} · burn Rs ${shortK(burn)} a month`}
				title={days === null ? "Covered" : `${days} days`}
			/>
			<Card>
				<Eyebrow>What if</Eyebrow>
				<View style={styles.chips}>
					<FilterChip label="Now" selected={whatIf === "now"} onPress={() => setWhatIf("now")} />
					<FilterChip
						label={`Job in ${MONTHS[soon.getMonth()]?.slice(0, 3)}`}
						selected={whatIf === "job-soon"}
						onPress={() => setWhatIf("job-soon")}
					/>
					<FilterChip
						label={`Job in ${MONTHS[later.getMonth()]?.slice(0, 3)}`}
						selected={whatIf === "job-later"}
						onPress={() => setWhatIf("job-later")}
					/>
					<FilterChip
						label={`Cut Rs ${shortK(CUT)}`}
						selected={whatIf === "cut"}
						onPress={() => setWhatIf("cut")}
					/>
				</View>
				<View style={styles.rows}>
					{points.map((point, index) => (
						<BalanceRow
							key={point.at.toISOString()}
							label={shortDate(point.at).toUpperCase()}
							value={rupees(index === 0 ? balance : point.balance)}
							share={point.balance / max}
							tone={balanceTone(point.balance, settings.monthlyCost)}
						/>
					))}
					{out ? (
						<BalanceRow
							label={shortDate(out).toUpperCase()}
							value="Rs 0"
							share={0}
							tone="statusDanger"
							danger
						/>
					) : null}
				</View>
				<PoText variant="meta13" tone={out ? "textWarning" : "textSuccess"}>
					{message}
				</PoText>
			</Card>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Edit the minimum"
				onPress={() => setMinimum(true)}
			>
				<Card>
					<CardHead title="The minimum, always paid" right={`Rs ${shortK(essentials)} / mo`} mono />
					{settings.minimum.map((item) => (
						<View key={item.label} style={styles.minRow}>
							<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
								{item.label}
							</PoText>
							<PoText variant="row15">{rupees(item.amount)}</PoText>
						</View>
					))}
					<PoText variant="meta13" tone="textTertiary">
						{settings.protect
							? "Runway counts only these now. Everything else waits until income starts."
							: "Everything else waits. Protect it to count only these until income starts."}
					</PoText>
				</Card>
			</Pressable>
			{notice ? (
				<PoText variant="meta13" tone="textWarning">
					{notice}
				</PoText>
			) : null}
			<ButtonPair
				secondary={{ label: "Edit numbers", onPress: () => setEditing(true) }}
				primary={{
					label: settings.protect ? "Back to full budget" : "Protect the minimum",
					onPress: () => {
						void saveSettings({ ...settings, protect: !settings.protect })
							.then(() => haptics.success())
							.catch(failed);
					},
				}}
			/>
			<NumbersSheet
				visible={editing}
				initial={{
					balance,
					monthlyCost: settings.monthlyCost,
					monthlyIncome: settings.monthlyIncome,
					salary: settings.salary,
				}}
				onClose={() => setEditing(false)}
				onSave={(value) => {
					void updateNumbers(settings, balance, value)
						.then(() => haptics.success())
						.catch(failed);
					setEditing(false);
				}}
			/>
			<MinimumSheet
				visible={minimum}
				items={settings.minimum}
				onClose={() => setMinimum(false)}
				onSave={(items) => {
					void saveSettings({ ...settings, minimum: items })
						.then(() => haptics.success())
						.catch(failed);
					setMinimum(false);
				}}
			/>
		</FinanceScreen>
	);
}

type Row = { label: string; amount: string };
const toRows = (items: readonly MinimumItem[]): Row[] => [
	...items.map((item) => ({ label: item.label, amount: String(Math.round(item.amount)) })),
	{ label: "", amount: "" },
];

/** The essentials: a name and a monthly amount each; an empty row adds one. */
function MinimumSheet({
	visible,
	items,
	onClose,
	onSave,
}: {
	visible: boolean;
	items: readonly MinimumItem[];
	onClose: () => void;
	onSave: (items: MinimumItem[]) => void;
}) {
	const [rows, setRows] = useState<Row[]>(() => toRows(items));
	useEffect(() => {
		if (visible) setRows(toRows(items));
		// oxlint-disable-next-line react/exhaustive-deps -- refill each time it opens
	}, [visible]);
	const change = (index: number, field: keyof Row, value: string) => {
		setRows((current) => {
			const next = current.map((row, at) =>
				at === index ? Object.assign({}, row, { [field]: value }) : row,
			);
			const last = next.at(-1);
			if (last && (last.label || last.amount) && next.length < 10)
				next.push({ label: "", amount: "" });
			return next;
		});
	};
	const save = () => {
		const kept: MinimumItem[] = [];
		for (const row of rows) {
			const amount = parseAmount(row.amount);
			if (row.label.trim() && amount) kept.push({ label: row.label.trim(), amount });
		}
		onSave(kept);
	};
	return (
		<Sheet
			visible={visible}
			title="The minimum"
			onClose={onClose}
			action={{ label: "Save", onPress: save }}
		>
			<View style={styles.sheet}>
				{rows.map((row, index) => (
					// Rows are edited in place by position.
					// oxlint-disable-next-line react/no-array-index-key
					<View key={index} style={styles.sheetRow}>
						<View style={styles.flex}>
							<TextField
								label={index === rows.length - 1 ? "Add one" : "Essential"}
								value={row.label}
								onChangeText={(value) => change(index, "label", value)}
								placeholder="Internet · job hunt"
							/>
						</View>
						<View style={styles.amountField}>
							<TextField
								label="Rs / month"
								value={row.amount}
								onChangeText={(value) => change(index, "amount", value)}
								keyboardType="number-pad"
							/>
						</View>
					</View>
				))}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	rows: { gap: 14, paddingVertical: 4 },
	minRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
	sheet: { gap: 12 },
	sheetRow: { flexDirection: "row", gap: 10 },
	amountField: { width: 120 },
});
