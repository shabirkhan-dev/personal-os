import type { ColorTokens } from "@personal-os/tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SkeletonList } from "@/components/ui/skeleton";
import { usePoTheme } from "@/theme";
import { useHealthToday } from "../hooks/use-health";
import { type HealthNote, healthNotes } from "../lib/health-insights";
import { adherence, average, bpBand, recent } from "../lib/health-model";
import { healthRoutes } from "../navigation";
import { BAND_TONES, Card, longDay } from "./health-cards";
import { HealthScreen } from "./health-screen";

type Range = 7 | 30;

/** Health Insights: the period's numbers, and what's worth doing something about. */
export function HealthInsightsScreen() {
	const { colors } = usePoTheme();
	const { data, now } = useHealthToday();
	const [range, setRange] = useState<Range>(7);
	const [hidden, setHidden] = useState<string[]>([]);

	const bp = recent(data.readings, "bp", now, range);
	const systolic = average(bp.map((reading) => reading.value));
	const diastolic = average(bp.map((reading) => reading.value2 ?? 0));
	const band = systolic !== null && diastolic !== null ? bpBand(systolic, diastolic) : null;
	const sleep = average(recent(data.readings, "sleep", now, range).map((reading) => reading.value));
	const taken = adherence(data.medicines, data.doses, now, range);
	const since = new Date(now.getTime() - range * 86_400_000).toISOString();
	const symptoms = data.symptoms.filter((symptom) => symptom.at >= since).length;
	const notes = healthNotes({ ...data, now }).filter((note) => !hidden.includes(noteKey(note)));
	const empty =
		data.readings.length === 0 && data.medicines.length === 0 && data.symptoms.length === 0;

	return (
		<HealthScreen insightsActive>
			<View style={styles.ranges}>
				<FilterChip label="This week" selected={range === 7} onPress={() => setRange(7)} />
				<FilterChip label="30 days" selected={range === 30} onPress={() => setRange(30)} />
			</View>
			{data.loading ? (
				<SkeletonList count={2} label="your insights" />
			) : empty ? (
				<EmptyCard
					icon="Filled/Chart"
					title="Nothing to look back on yet"
					body="Add a few readings, a medicine or how you feel, and this fills in."
				>
					<PillButton label="Open vitals" onPress={() => healthRoutes.vitals()} />
				</EmptyCard>
			) : (
				<View style={styles.stats}>
					<Stat
						label="Blood pressure"
						value={
							systolic === null ? "–" : `${Math.round(systolic)}/${Math.round(diastolic ?? 0)}`
						}
						foot={band?.label ?? `${bp.length} readings`}
						tone={band ? BAND_TONES[band.tone] : "textTertiary"}
					/>
					<Stat
						label="Sleep"
						value={sleep === null ? "–" : `${Math.floor(sleep / 60)}h ${Math.round(sleep % 60)}m`}
						foot="a night"
						tone="textTertiary"
					/>
					<Stat
						label="Medicines"
						value={taken === null ? "–" : `${Math.round(taken * 100)}%`}
						foot={`${symptoms} ${symptoms === 1 ? "symptom" : "symptoms"}`}
						tone={taken !== null && taken < 0.8 ? "textDanger" : "textTertiary"}
					/>
				</View>
			)}
			{notes.length > 0 ? (
				<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
					Worth a look
				</PoText>
			) : null}
			{notes.map((note) => {
				const text = noteText(note);
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
							<PillButton label={text.primary} style={styles.flex} onPress={text.act} />
							<PillButton
								label="Got it"
								variant="secondary"
								onPress={() => setHidden((list) => [...list, noteKey(note)])}
							/>
						</View>
					</Card>
				);
			})}
			<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
				A guide to talk over with your doctor, not a diagnosis.
			</PoText>
		</HealthScreen>
	);
}

const noteKey = (note: HealthNote) =>
	`${note.kind}:${"title" in note ? note.title : "name" in note ? note.name : "test" in note ? note.test : ""}`;

function noteText(note: HealthNote): {
	title: string;
	body: string;
	primary: string;
	act: () => void;
} {
	switch (note.kind) {
		case "bp-high":
			return {
				title: "Blood pressure is running high",
				body: `Your two-week average is ${note.systolic}/${note.diastolic} (${note.label.toLowerCase()}). Keep measuring at the same time each day and show these to your doctor.`,
				primary: "See readings",
				act: () => healthRoutes.vitals("bp"),
			};
		case "overdue":
			return {
				title: `${note.title} is overdue`,
				body: `It was due ${longDay(note.due)}. Book it while you think of it.`,
				primary: "Book it",
				act: healthRoutes.checkups,
			};
		case "refill":
			return {
				title: `${note.name} is running out`,
				body:
					note.days <= 0
						? "None left at your daily dose. Get a refill today."
						: `About ${note.days} ${note.days === 1 ? "day" : "days"} left at your daily dose. Get a refill this week.`,
				primary: "Update stock",
				act: healthRoutes.medicines,
			};
		case "lab":
			return {
				title: `${note.test} is ${note.status}`,
				body: `Your last result was ${note.value} ${note.unit}, outside its range. Ask your doctor what to do about it.`,
				primary: "See results",
				act: healthRoutes.labs,
			};
		case "sleep-symptom":
			return {
				title: `${note.symptom} after short nights`,
				body: `It came up after ${Math.round(note.short * 100)}% of nights under 6 hours, and ${Math.round(note.rest * 100)}% of longer ones.`,
				primary: "See sleep",
				act: () => healthRoutes.vitals("sleep"),
			};
	}
}

function Stat({
	label,
	value,
	foot,
	tone,
}: {
	label: string;
	value: string;
	foot: string;
	tone: keyof ColorTokens;
}) {
	return (
		<View style={styles.flex}>
			<Card>
				<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
					{label}
				</PoText>
				<PoText variant="title18" numberOfLines={1} adjustsFontSizeToFit>
					{value}
				</PoText>
				<PoText variant="meta13" tone={tone} numberOfLines={1}>
					{foot}
				</PoText>
			</Card>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ranges: { flexDirection: "row", gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	pad: { paddingHorizontal: 4 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	actions: { flexDirection: "row", gap: 8 },
});
