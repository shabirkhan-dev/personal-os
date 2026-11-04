import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { newLabId, removeLab, saveLab } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import { labHistory, type LabResult, labStatus } from "../lib/health-model";
import { Card, longDay } from "./health-cards";
import { HealthScreen } from "./health-screen";

/** Common tests with the usual adult range, so a new result starts filled in. */
const PRESETS: { test: string; unit: string; low: number | null; high: number | null }[] = [
	{ test: "HbA1c", unit: "%", low: null, high: 5.7 },
	{ test: "Fasting glucose", unit: "mg/dL", low: 70, high: 100 },
	{ test: "Total cholesterol", unit: "mg/dL", low: null, high: 200 },
	{ test: "LDL", unit: "mg/dL", low: null, high: 100 },
	{ test: "HDL", unit: "mg/dL", low: 40, high: null },
	{ test: "Triglycerides", unit: "mg/dL", low: null, high: 150 },
	{ test: "Vitamin D", unit: "ng/mL", low: 30, high: 100 },
	{ test: "Vitamin B12", unit: "pg/mL", low: 200, high: 900 },
	{ test: "Haemoglobin", unit: "g/dL", low: 13.5, high: 17.5 },
	{ test: "TSH", unit: "mIU/L", low: 0.4, high: 4 },
	{ test: "Creatinine", unit: "mg/dL", low: 0.7, high: 1.3 },
];

const STATUS: Record<
	ReturnType<typeof labStatus>,
	{ label: string; tone: "textSuccess" | "textDanger" | "textTertiary" }
> = {
	normal: { label: "In range", tone: "textSuccess" },
	low: { label: "Low", tone: "textDanger" },
	high: { label: "High", tone: "textDanger" },
	unknown: { label: "No range", tone: "textTertiary" },
};

const parseNumber = (text: string) => {
	const value = Number(text.replace(",", "."));
	return text.trim() && Number.isFinite(value) ? value : null;
};

/** Lab results by test: the latest against its range, and the ones before it. */
export function LabsScreen() {
	const { data, today } = useHealthToday();
	const [editing, setEditing] = useState<{ result: LabResult | null } | null>(null);
	const { colors } = usePoTheme();
	const groups = [...labHistory(data.labs).values()].sort((a, b) =>
		(b.at(-1)?.on ?? "").localeCompare(a.at(-1)?.on ?? ""),
	);

	return (
		<HealthScreen
			action={{
				icon: "Line/Plus",
				label: "Add a result",
				onPress: () => setEditing({ result: null }),
			}}
		>
			<ScreenTitle eyebrow="From your blood tests" title="Lab results" />
			{data.loading ? (
				<SkeletonList count={2} label="your results" />
			) : groups.length === 0 ? (
				<EmptyCard
					icon="Drop"
					title="No results yet"
					body="Add the numbers from your last blood test. Each one is checked against its range and tracked over time."
				>
					<PillButton label="Add a result" onPress={() => setEditing({ result: null })} />
				</EmptyCard>
			) : (
				<Card>
					{groups.map((history) => {
						const last = history.at(-1) as LabResult;
						const status = STATUS[labStatus(last)];
						const before = history.slice(-4, -1);
						return (
							<Pressable
								key={last.id}
								accessibilityRole="button"
								onPress={() => setEditing({ result: last })}
								style={({ pressed }) => [
									styles.row,
									pressed ? { backgroundColor: colors.bgHover } : null,
								]}
							>
								<View style={styles.flex}>
									<PoText variant="row15">{last.test}</PoText>
									<PoText variant="meta13" tone="textTertiary">
										{before.length
											? `Before: ${before.map((result) => result.value).join(" → ")}`
											: longDay(last.on)}
									</PoText>
								</View>
								<View style={styles.value}>
									<PoText variant="row15">
										{String(last.value)}
										<PoText variant="meta13" tone="textTertiary">{` ${last.unit}`}</PoText>
									</PoText>
									<PoText variant="meta13" tone={status.tone}>
										{status.label}
									</PoText>
								</View>
							</Pressable>
						);
					})}
				</Card>
			)}
			<LabSheet
				visible={editing !== null}
				result={editing?.result ?? null}
				today={today}
				onClose={() => setEditing(null)}
			/>
		</HealthScreen>
	);
}

function LabSheet({
	visible,
	result,
	today,
	onClose,
}: {
	visible: boolean;
	result: LabResult | null;
	today: string;
	onClose: () => void;
}) {
	const [test, setTest] = useState("");
	const [value, setValue] = useState("");
	const [unit, setUnit] = useState("");
	const [low, setLow] = useState("");
	const [high, setHigh] = useState("");
	const [on, setOn] = useState(today);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setTest(result?.test ?? "");
		setValue(result ? String(result.value) : "");
		setUnit(result?.unit ?? "");
		setLow(result?.low === null || result?.low === undefined ? "" : String(result.low));
		setHigh(result?.high === null || result?.high === undefined ? "" : String(result.high));
		setOn(result?.on ?? today);
		setError(null);
	}, [visible, result, today]);

	const pick = (name: string) => {
		const preset = PRESETS.find((item) => item.test === name);
		if (!preset) return;
		setTest(preset.test);
		setUnit(preset.unit);
		setLow(preset.low === null ? "" : String(preset.low));
		setHigh(preset.high === null ? "" : String(preset.high));
	};

	const save = async () => {
		const number = parseNumber(value);
		if (!test.trim() || number === null) {
			setError("Add the test's name and its number.");
			return;
		}
		try {
			await saveLab({
				id: result?.id ?? newLabId(),
				test: test.trim(),
				value: number,
				unit: unit.trim(),
				low: parseNumber(low),
				high: parseNumber(high),
				on: /^\d{4}-\d{2}-\d{2}$/.test(on) ? on : today,
			});
			haptics.success();
			onClose();
		} catch (caught) {
			console.error("[health] could not save the result", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	const remove = () => {
		if (!result) return;
		showDialog(`Delete this ${result.test} result?`, undefined, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					void removeLab(result.id).catch((caught: unknown) =>
						console.error("[health] could not delete the result", caught),
					);
					onClose();
				},
			},
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={result ? "Lab result" : "Add a result"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			{result ? null : (
				<ChoiceChips
					options={PRESETS.map((preset) => ({ value: preset.test, label: preset.test }))}
					value={PRESETS.some((preset) => preset.test === test) ? test : null}
					onChange={pick}
				/>
			)}
			<TextField label="Test" value={test} onChangeText={setTest} placeholder="Vitamin D" />
			<TextField
				label="Result"
				value={value}
				onChangeText={setValue}
				keyboardType="decimal-pad"
				suffix={unit || undefined}
			/>
			<View style={styles.pair}>
				<View style={styles.flex}>
					<TextField
						label="Range from"
						value={low}
						onChangeText={setLow}
						keyboardType="decimal-pad"
					/>
				</View>
				<View style={styles.flex}>
					<TextField
						label="Range to"
						value={high}
						onChangeText={setHigh}
						keyboardType="decimal-pad"
					/>
				</View>
			</View>
			<TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="ng/mL" />
			<TextField label="Date (YYYY-MM-DD)" value={on} onChangeText={setOn} placeholder={today} />
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			{result ? <PillButton label="Delete" variant="danger" onPress={remove} /> : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 8,
		borderRadius: 12,
	},
	value: { alignItems: "flex-end" },
	pair: { flexDirection: "row", gap: 8 },
});
