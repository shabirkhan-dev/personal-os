import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { logSymptom, removeSymptom } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import { SYMPTOM_LABELS, SYMPTOMS, type Symptom, type SymptomKind } from "../lib/health-model";
import { ago, Card, CardHead } from "./health-cards";
import { HealthScreen } from "./health-screen";

const SEVERITY = [
	{ value: "1", label: "Mild" },
	{ value: "2", label: "Medium" },
	{ value: "3", label: "Bad" },
] as const;

const remove = (symptom: Symptom) =>
	showDialog(`Delete ${SYMPTOM_LABELS[symptom.kind].toLowerCase()}?`, undefined, [
		{ text: "Cancel", style: "cancel" },
		{
			text: "Delete",
			style: "destructive",
			onPress: () =>
				void removeSymptom(symptom.id).catch((error: unknown) =>
					console.error("[health] could not delete the symptom", error),
				),
		},
	]);

/** How you feel today in two taps, and the last two weeks of it. */
export function SymptomsScreen() {
	const { data, now } = useHealthToday();
	const [picked, setPicked] = useState<SymptomKind[]>([]);
	const [severity, setSeverity] = useState<"1" | "2" | "3">("2");
	const [notice, setNotice] = useState<string | null>(null);
	const since = new Date(now.getTime() - 14 * 86_400_000).toISOString();
	const recent = data.symptoms
		.filter((symptom) => symptom.at >= since)
		.sort((a, b) => b.at.localeCompare(a.at));

	const toggle = (kind: SymptomKind) =>
		setPicked((current) =>
			current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
		);

	const save = async () => {
		try {
			for (const kind of picked) {
				// oxlint-disable-next-line eslint/no-await-in-loop -- a handful at most
				await logSymptom(kind, Number(severity) as Symptom["severity"]);
			}
			haptics.success();
			setNotice(`${picked.map((kind) => SYMPTOM_LABELS[kind]).join(", ")} noted for today.`);
			setPicked([]);
		} catch (error) {
			console.error("[health] could not save the symptom", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<HealthScreen>
			<ScreenTitle eyebrow="Patterns show up in Insights" title="How do you feel?" />
			<Card>
				<View style={styles.chips}>
					{SYMPTOMS.map((kind) => (
						<FilterChip
							key={kind}
							label={SYMPTOM_LABELS[kind]}
							selected={picked.includes(kind)}
							onPress={() => toggle(kind)}
						/>
					))}
				</View>
				<SegmentedControl
					options={SEVERITY}
					value={severity}
					onChange={setSeverity}
					accessibilityLabel="How bad"
				/>
				<PillButton label="Save" disabled={picked.length === 0} onPress={() => void save()} />
				{notice ? (
					<PoText variant="meta13" tone="textSecondary">
						{notice}
					</PoText>
				) : null}
			</Card>
			{recent.length > 0 ? (
				<Card>
					<CardHead title="Last two weeks" />
					{recent.map((symptom) => (
						<Pressable
							key={symptom.id}
							accessibilityRole="button"
							accessibilityHint="Long press to delete"
							onLongPress={() => remove(symptom)}
							style={styles.row}
						>
							<PoText variant="row15" style={styles.flex}>
								{SYMPTOM_LABELS[symptom.kind]}
							</PoText>
							<PoText variant="meta13" tone="textTertiary">
								{`${SEVERITY[symptom.severity - 1]?.label ?? ""} · ${ago(symptom.at, now)}`}
							</PoText>
						</Pressable>
					))}
				</Card>
			) : null}
		</HealthScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
