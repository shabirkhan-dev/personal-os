import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { deleteSession, updateSession } from "../data/training-actions";
import { useTraining } from "../hooks/use-training";
import { templateById } from "../lib/library";
import { heroOf } from "../lib/photos";
import { clockTime, negativeSplit, paceOf } from "../lib/training-math";
import { FEELS } from "../lib/training-model";
import { Card, CardHead } from "./home-cards";
import { TrainingImage } from "./training-image";
import { TrainingScreen } from "./training-screen";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_PHOTO = {
	running: "mountain-run",
	boxing: "shadow-boxing",
	yoga: "yoga",
	football: "football",
	volleyball: "volleyball",
} as const;

/** One logged session: run numbers and splits, or the sets done, how it felt and a note. */
export function SessionScreen({ id }: { id: string }) {
	const { colors } = usePoTheme();
	const { sessions } = useTraining();
	const session = sessions.find((item) => item.id === id);
	const [noting, setNoting] = useState<string | null>(null);

	if (!session) {
		return (
			<TrainingScreen>
				<EmptyCard icon="Dumbbell" title="Session not found" body="It may have been deleted." />
			</TrainingScreen>
		);
	}

	const template = templateById(session.template);
	const photo =
		template?.hero ??
		(session.sport in DEFAULT_PHOTO
			? DEFAULT_PHOTO[session.sport as keyof typeof DEFAULT_PHOTO]
			: "push-ups");
	const started = new Date(session.startedAt);
	const pace = paceOf(session);
	const stats: { label: string; value: string }[] = [
		{ label: "Time", value: clockTime(session.durationMin * 60) },
		...(pace ? [{ label: "Pace", value: `${clockTime(pace)} /km` }] : []),
		...(session.avgHr ? [{ label: "Avg heart", value: `${session.avgHr} bpm` }] : []),
		...(session.climbM !== null ? [{ label: "Climb", value: `+${session.climbM} m` }] : []),
		...(!pace ? [{ label: "Active", value: `${session.kcal} kcal` }] : []),
		...(session.rounds ? [{ label: "Rounds", value: String(session.rounds) }] : []),
		...(session.sets.length ? [{ label: "Sets", value: String(session.sets.length) }] : []),
	];
	const grouped = new Map<string, number[]>();
	for (const set of session.sets)
		grouped.set(set.exercise, [...(grouped.get(set.exercise) ?? []), set.value]);
	const fastest = Math.min(...session.splits);
	const slowest = Math.max(...session.splits);

	const remove = () =>
		Alert.alert("Delete this session?", "It comes off your week and your bests.", [
			{ text: "Keep", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					void deleteSession(session).then(() => router.back());
				},
			},
		]);

	return (
		<TrainingScreen action={{ icon: "Filled/Edit", label: "Delete session", onPress: remove }}>
			<ScreenTitle
				eyebrow={`${DAYS[started.getDay()]} ${started.getDate()} ${MONTHS[started.getMonth()]} · ${clockOf(minutesOf(started))} · ${session.title}`}
				title={session.distanceKm ? `${session.distanceKm.toFixed(2)} km` : session.title}
			/>
			<TrainingImage photo={heroOf(photo)} size={170} fill radius={28} />
			<View style={styles.stats}>
				{stats.map((stat) => (
					<View
						key={stat.label}
						style={[
							styles.stat,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<PoText variant="eyebrow11" tone="textTertiary">
							{stat.label}
						</PoText>
						<PoText variant="title18">{stat.value}</PoText>
					</View>
				))}
			</View>
			{session.splits.length > 0 ? (
				<Card>
					<CardHead
						title="Splits"
						right={negativeSplit(session.splits) ? "negative split ✓" : undefined}
					/>
					{session.splits.map((split, index) => (
						<View key={`${index}-${split}`} style={styles.split}>
							<PoText
								variant="mono13"
								tone="textTertiary"
								style={styles.km}
							>{`KM ${index + 1}`}</PoText>
							<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
								<View
									style={[
										styles.fill,
										{
											width: `${slowest === fastest ? 80 : 60 + ((slowest - split) / (slowest - fastest)) * 35}%`,
											backgroundColor: colors.statusSuccess,
										},
									]}
								/>
							</View>
							<PoText variant="mono13">{clockTime(split)}</PoText>
						</View>
					))}
				</Card>
			) : null}
			{grouped.size > 0 ? (
				<Card>
					<CardHead title="Sets" right={`${session.sets.length} done`} />
					{[...grouped.entries()].map(([exercise, values]) => (
						<View key={exercise} style={styles.setRow}>
							<PoText variant="row15" style={styles.flex}>
								{exercise}
							</PoText>
							<PoText variant="mono13" tone="textSecondary">
								{values.join(" · ")}
							</PoText>
						</View>
					))}
				</Card>
			) : null}
			<Card>
				<CardHead title="Effort" right={session.feel ?? "how did it feel?"} />
				<View style={styles.chips}>
					{FEELS.map((feel) => (
						<FilterChip
							key={feel}
							label={feel.charAt(0).toUpperCase() + feel.slice(1)}
							selected={session.feel === feel}
							onPress={() => void updateSession({ ...session, feel })}
						/>
					))}
				</View>
				{session.note ? (
					<PoText variant="body15" tone="textSecondary">
						{session.note}
					</PoText>
				) : null}
			</Card>
			<Footer>
				<PillButton
					label={session.note ? "Edit note" : "Add a note"}
					variant="secondary"
					style={styles.flex}
					onPress={() => setNoting(session.note)}
				/>
				<PillButton label="Done" style={styles.flex} onPress={() => router.back()} />
			</Footer>
			<Sheet
				visible={noting !== null}
				title="Note"
				onClose={() => setNoting(null)}
				action={{
					label: "Save",
					onPress: () => {
						haptics.success();
						void updateSession({ ...session, note: (noting ?? "").trim().slice(0, 500) });
						setNoting(null);
					},
				}}
			>
				<TextField
					label="Note"
					value={noting ?? ""}
					onChangeText={setNoting}
					placeholder="Legs heavy after yesterday"
				/>
			</Sheet>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	stat: { width: "48.8%", gap: 4, padding: 14, borderRadius: 22, borderWidth: 1 },
	split: { flexDirection: "row", alignItems: "center", gap: 12 },
	km: { width: 40 },
	track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
	fill: { height: 6, borderRadius: 3 },
	setRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
	chips: { flexDirection: "row", gap: 8 },
});
