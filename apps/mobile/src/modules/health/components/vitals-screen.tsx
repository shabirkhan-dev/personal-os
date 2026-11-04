import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SkeletonList } from "@/components/ui/skeleton";
import { removeReading } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import {
	average,
	READING_KINDS,
	READING_LABELS,
	READING_UNITS,
	type Reading,
	type ReadingKind,
	readingBand,
	recent,
} from "../lib/health-model";
import { ago, BAND_TONES, Card } from "./health-cards";
import { HealthScreen } from "./health-screen";
import { LogReadingSheet } from "./log-reading-sheet";

const SOURCE_LABELS: Record<Reading["source"], string> = {
	manual: "Added by you",
	"health-connect": "Health Connect",
	healthkit: "Apple Health",
};

/** Phone-only kinds can't be typed in; they come from Health Connect or Apple Health. */
const SYNCED_ONLY: ReadonlySet<ReadingKind> = new Set(["steps", "sleep", "hrv", "resting-hr"]);

const show = (reading: Reading) => {
	if (reading.kind === "bp") return `${reading.value}/${reading.value2}`;
	if (reading.kind === "sleep") return `${Math.floor(reading.value / 60)}h ${reading.value % 60}m`;
	if (reading.kind === "steps") return Math.round(reading.value).toLocaleString("en-US");
	return String(Math.round(reading.value * 10) / 10);
};

/** One vital over time: the latest, your 7- and 30-day averages and every reading. */
export function VitalsScreen() {
	const params = useLocalSearchParams<{ kind?: string }>();
	const start = READING_KINDS.find((kind) => kind === params.kind) ?? "bp";
	const [kind, setKind] = useState<ReadingKind>(start);
	const [adding, setAdding] = useState(false);
	const { data, now } = useHealthToday();
	const month = recent(data.readings, kind, now, 30);
	const week = recent(data.readings, kind, now, 7);
	const avg = (list: Reading[]) => {
		const top = average(list.map((reading) => reading.value));
		if (top === null) return "–";
		if (kind !== "bp") return String(Math.round(top * 10) / 10);
		const bottom = average(list.map((reading) => reading.value2 ?? 0));
		return `${Math.round(top)}/${Math.round(bottom ?? 0)}`;
	};
	const unit = READING_UNITS[kind] === "min" ? "" : READING_UNITS[kind];

	const remove = (reading: Reading) =>
		showDialog("Delete this reading?", `${READING_LABELS[reading.kind]} ${show(reading)} ${unit}`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () =>
					void removeReading(reading.id).catch((error: unknown) =>
						console.error("[health] could not delete the reading", error),
					),
			},
		]);

	return (
		<HealthScreen
			action={
				SYNCED_ONLY.has(kind)
					? undefined
					: { icon: "Line/Plus", label: "Add a reading", onPress: () => setAdding(true) }
			}
		>
			<ScreenTitle eyebrow="Vitals" title={READING_LABELS[kind]} />
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.kinds}
			>
				{READING_KINDS.map((item) => (
					<FilterChip
						key={item}
						label={READING_LABELS[item]}
						selected={item === kind}
						onPress={() => setKind(item)}
					/>
				))}
			</ScrollView>

			{data.loading ? (
				<SkeletonList count={2} label="your readings" />
			) : month.length === 0 ? (
				<EmptyCard
					icon="Heart"
					title={`No ${READING_LABELS[kind].toLowerCase()} yet`}
					body={
						SYNCED_ONLY.has(kind)
							? "This comes from your phone or watch through Health Connect or Apple Health."
							: "Add one by hand, or let your phone or watch fill it in."
					}
				>
					{SYNCED_ONLY.has(kind) ? null : (
						<PillButton label="Add a reading" onPress={() => setAdding(true)} />
					)}
				</EmptyCard>
			) : (
				<>
					<View style={styles.stats}>
						<Stat label="Latest" value={month[0] ? show(month[0]) : "–"} unit={unit} />
						<Stat label="7 days" value={avg(week)} unit={unit} />
						<Stat label="30 days" value={avg(month)} unit={unit} />
					</View>
					<Card>
						{month.map((reading) => {
							const band = readingBand(reading);
							return (
								<Pressable
									key={reading.id}
									accessibilityRole="button"
									accessibilityHint="Long press to delete"
									onLongPress={() => remove(reading)}
									style={styles.row}
								>
									<View style={styles.flex}>
										<PoText variant="row15">
											{show(reading)}
											<PoText variant="meta13" tone="textTertiary">{` ${unit}`}</PoText>
										</PoText>
										<PoText variant="meta13" tone="textTertiary">
											{`${ago(reading.at, now)} · ${new Date(reading.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · ${SOURCE_LABELS[reading.source]}`}
										</PoText>
									</View>
									{band ? (
										<PoText variant="meta13" tone={BAND_TONES[band.tone]}>
											{band.label}
										</PoText>
									) : null}
								</Pressable>
							);
						})}
					</Card>
					<PoText variant="meta13" tone="textTertiary" style={styles.note}>
						Long press a reading to delete it. Ranges are a guide, not a diagnosis.
					</PoText>
				</>
			)}
			<LogReadingSheet visible={adding} initialKind={kind} onClose={() => setAdding(false)} />
		</HealthScreen>
	);
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
	return (
		<View style={styles.flex}>
			<Card>
				<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
					{label}
				</PoText>
				<PoText variant="title18" numberOfLines={1} adjustsFontSizeToFit>
					{value}
				</PoText>
				<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
					{value === "–" || !unit ? " " : unit}
				</PoText>
			</Card>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	kinds: { gap: 8 },
	stats: { flexDirection: "row", gap: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
	note: { paddingHorizontal: 4 },
});
