import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActionPills, EmptyCard } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { logReading, logSymptom, markDose } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import { READING_LABELS, type ReadingKind, readingBand, type TodayDose } from "../lib/health-model";
import { parseHealthLine, symptomLabel } from "../lib/parse-health-line";
import { healthRoutes } from "../navigation";
import {
	DosesCard,
	NextCheckupCard,
	ReadinessCard,
	type VitalTile,
	VitalsGrid,
} from "./health-cards";
import { LogReadingSheet } from "./log-reading-sheet";
import { PhoneHealthCard } from "./phone-health-card";

const round = (value: number) => String(Math.round(value * 10) / 10);

/**
 * Health Home: the ask bar, today's readiness, the latest vitals, today's medicines and the next
 * checkup. The header's button adds a reading.
 */
export function HealthHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, readiness, bp, sugar, heart, spo2, weight, steps, doses, due, today } =
		useHealthToday();
	const [sheet, setSheet] = useState<{ open: boolean; kind: ReadingKind }>({
		open: false,
		kind: "bp",
	});
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (actionRequest > 0) setSheet({ open: true, kind: "bp" });
	}, [actionRequest]);

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};
	const failed = (error: unknown) => {
		console.error("[health] could not save", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const take = (dose: TodayDose) =>
		void markDose(dose.medicine, today, dose.minutes, "taken")
			.then(() => haptics.success())
			.catch(failed);
	const skip = (dose: TodayDose) =>
		void markDose(dose.medicine, today, dose.minutes, "skipped").catch(failed);

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseHealthLine(text);
		if (!intent) {
			say("Try “bp 120/80”, “sugar 95 fasting”, “took metformin” or “headache”.", spoken);
			return;
		}
		if (intent.kind === "reading") {
			void logReading({
				kind: intent.reading,
				value: intent.value,
				value2: intent.value2,
				context: intent.context,
			})
				.then((reading) => {
					haptics.success();
					const band = readingBand(reading);
					const shown =
						reading.kind === "bp" ? `${reading.value}/${reading.value2}` : round(reading.value);
					say(
						`${READING_LABELS[reading.kind]} ${shown} saved${band ? ` · ${band.label}` : ""}.`,
						spoken,
					);
				})
				.catch(failed);
			return;
		}
		if (intent.kind === "took") {
			const name = intent.medicine.toLowerCase();
			const dose = doses.find(
				(item) =>
					item.medicine.name.toLowerCase().includes(name) &&
					(item.state === "due" || item.state === "missed" || item.state === "later"),
			);
			if (!dose) {
				say(`No ${intent.medicine} dose left today. Add it under Medicines.`, spoken);
				return;
			}
			take(dose);
			say(`${dose.medicine.name} marked taken.`, spoken);
			return;
		}
		void logSymptom(intent.symptom, intent.severity)
			.then(() => say(`${symptomLabel(intent.symptom)} noted for today.`, spoken))
			.catch(failed);
	};

	// A line said on Talk to OS lands here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "health") return;
		const line = useAskInbox.getState().take("health");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const tiles: VitalTile[] = [
		{
			kind: "bp",
			label: "Blood pressure",
			icon: "Heart",
			reading: bp,
			value: bp?.value2 ? `${bp.value}/${bp.value2}` : null,
			unit: "mmHg",
		},
		{
			kind: heart?.kind ?? "resting-hr",
			label: heart?.kind === "heart-rate" ? "Heart rate" : "Resting heart rate",
			icon: "Lightning",
			reading: heart,
			value: heart ? round(heart.value) : null,
			unit: "bpm",
		},
		{
			kind: "blood-sugar",
			label: "Blood sugar",
			icon: "Drop",
			reading: sugar,
			value: sugar ? round(sugar.value) : null,
			unit: "mg/dL",
		},
		{
			kind: "spo2",
			label: "Blood oxygen",
			icon: "Drop",
			reading: spo2,
			value: spo2 ? round(spo2.value) : null,
			unit: "%",
		},
		{
			kind: "weight",
			label: "Weight",
			icon: "Dumbbell",
			reading: weight,
			value: weight ? round(weight.value) : null,
			unit: "kg",
		},
		{
			kind: "steps",
			label: "Steps today",
			icon: "Footsteps",
			reading: steps,
			value: steps ? Math.round(steps.value).toLocaleString("en-US") : null,
			unit: "",
		},
	];
	const nothingYet = !data.loading && data.readings.length === 0 && data.medicines.length === 0;

	return (
		<>
			<AskBar suggestions={[]} placeholder="BP 120/80, took my pill…" onSubmit={onLine} />
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			<ActionPills
				actions={[
					{
						label: "Add reading",
						icon: "Line/Plus",
						onPress: () => setSheet({ open: true, kind: "bp" }),
					},
					{ label: "Symptom", icon: "Heart", onPress: healthRoutes.symptoms },
					{ label: "My profile", icon: "Filled/User", onPress: healthRoutes.profile },
				]}
			/>
			{readiness ? <ReadinessCard readiness={readiness} /> : null}
			{nothingYet ? (
				<EmptyCard
					icon="Heart"
					title="Start with one reading"
					body="Add your blood pressure, a medicine you take or your next checkup, or connect your phone's health data below."
				>
					<PillButton label="Add a reading" onPress={() => setSheet({ open: true, kind: "bp" })} />
				</EmptyCard>
			) : null}
			<VitalsGrid
				tiles={tiles}
				onOpen={(kind) => healthRoutes.vitals(kind)}
				onAdd={(kind) =>
					kind === "steps" ? healthRoutes.vitals("steps") : setSheet({ open: true, kind })
				}
			/>
			{doses.length > 0 ? (
				<DosesCard doses={doses} onTake={take} onSkip={skip} onOpen={healthRoutes.medicines} />
			) : (
				<View>
					<PillButton label="Add a medicine" variant="secondary" onPress={healthRoutes.medicines} />
				</View>
			)}
			{due[0] ? <NextCheckupCard due={due[0]} onOpen={healthRoutes.checkups} /> : null}
			<PhoneHealthCard />
			<LogReadingSheet
				visible={sheet.open}
				initialKind={sheet.kind}
				onClose={() => setSheet((current) => ({ ...current, open: false }))}
				onSaved={(kind) => setNotice(`${READING_LABELS[kind]} saved.`)}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	notice: { paddingHorizontal: 4 },
});
