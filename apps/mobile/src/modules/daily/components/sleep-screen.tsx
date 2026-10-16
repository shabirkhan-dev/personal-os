import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Footer, ListCard, ListRow, MetaChip, ScreenTitle, Segments } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { saveSettings, saveSleep, toggleWindDown } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { averageSleep, hoursLabel, lastDays, sleepWeek, sleptMinutes } from "../lib/daily-math";
import type { WindDownId } from "../lib/daily-model";
import { readClock } from "../lib/parse-daily-line";
import { requestReminderPermission } from "../services/daily-alarms";
import { Card, CardHead, CheckRow } from "./daily-cards";
import { DailyScreen } from "./daily-screen";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** Sleep: last night, the week against the target, tonight's wind-down and the alarms. */
export function SleepScreen() {
	const { colors } = usePoTheme();
	const { data, sources, now, today, log } = useDailyToday();
	const { settings, sleep } = data;
	const [logging, setLogging] = useState<{ bed: string; wake: string } | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const week = lastDays(now, 7);
	const nights = sleepWeek(sleep, week);
	const avg = averageSleep(sleep, week);
	const last = sleep.find((item) => item.id === today) ?? sleep.at(-1) ?? null;
	const fajr = sources.faith ? sources.extra.faith.fajr : null;
	const wake = fajr ? fajr.minutes - 10 : settings.wakeAt;
	const max = Math.max(settings.sleepTarget + 60, ...nights.map((night) => night.minutes ?? 0));
	const nightDone = sources.care?.night.finished ?? false;

	const rows: { id: WindDownId; title: string; detail: string; done: boolean; auto?: boolean }[] = [
		{
			id: "phone",
			title: "Phone on the charger",
			detail: "Outside the bedroom",
			done: log?.windDown.includes("phone") ?? false,
		},
		...(sources.care
			? [
					{
						id: "skin" as const,
						title: "Night skin routine",
						detail: "From your Care routine",
						done: nightDone || (log?.windDown.includes("skin") ?? false),
						auto: nightDone,
					},
				]
			: []),
		...(sources.faith
			? [
					{
						id: "dua" as const,
						title: "Dua before sleep",
						detail: "Bismika Allahumma · Faith",
						done: log?.windDown.includes("dua") ?? false,
					},
				]
			: []),
		{
			id: "lights",
			title: "Lights low, no screens",
			detail: `From ${clockOf(settings.windDownAt + 15)}`,
			done: log?.windDown.includes("lights") ?? false,
		},
		{
			id: "bed",
			title: `In bed by ${clockOf(settings.bedAt)}`,
			detail: fajr ? `Fajr alarm at ${clockOf(wake)}` : `Wake at ${clockOf(wake)}`,
			done: log?.windDown.includes("bed") ?? false,
		},
	];
	const doneCount = rows.filter((row) => row.done).length;
	const next = rows.find((row) => !row.done);

	const toggleAlarm = async (key: keyof typeof settings.alarms) => {
		const on = !settings.alarms[key];
		if (on && !(await requestReminderPermission())) {
			setNotice("Allow notifications in Settings for alarms.");
			return;
		}
		haptics.select();
		await saveSettings({ ...settings, alarms: { ...settings.alarms, [key]: on } });
	};

	const saveNight = () => {
		if (!logging) return;
		const bed = readClock(logging.bed, true);
		const up = readClock(logging.wake, false);
		if (bed === null || up === null) {
			setNotice("Use times like 23:40 and 06:20.");
			return;
		}
		const wakeAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, up);
		const bedAt = new Date(wakeAt);
		bedAt.setHours(0, bed);
		if (bed > up) bedAt.setDate(bedAt.getDate() - 1);
		saveSleep(bedAt, wakeAt)
			.then(() => {
				haptics.success();
				setLogging(null);
			})
			.catch(() => setNotice("Couldn't save on this phone. Try again."));
	};

	return (
		<DailyScreen>
			<ScreenTitle
				eyebrow={`Last 7 nights · target ${hoursLabel(settings.sleepTarget)}`}
				title="Sleep"
			>
				{avg !== null ? (
					<MetaChip
						icon="Lightning"
						iconTone="statusCaution"
						label={`Average ${hoursLabel(avg)}`}
					/>
				) : null}
				<MetaChip icon="Moon" label={`Bed ${clockOf(settings.bedAt)}`} />
				<MetaChip icon="Sun" label={`Wake ${clockOf(wake)}`} />
			</ScreenTitle>
			<Card>
				<CardHead title="Sleep" right={avg !== null ? `Avg ${hoursLabel(avg)}` : undefined} />
				{last ? (
					<View style={styles.last}>
						<PoText variant="hero40">{hoursLabel(sleptMinutes(last))}</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{`${clockOf(minutesOf(new Date(last.bedAt)))} → ${clockOf(minutesOf(new Date(last.wakeAt)))}`}
						</PoText>
					</View>
				) : (
					<PoText variant="body15" tone="textSecondary">
						Log last night to start. Say “slept 23:40 to 06:20” on Daily's ask bar, or tap Log last
						night.
					</PoText>
				)}
				<View style={styles.chart}>
					<View
						style={[
							styles.target,
							{
								bottom: 22 + (settings.sleepTarget / max) * 70,
								backgroundColor: colors.borderStrong,
							},
						]}
					/>
					{nights.map((night, index) => {
						const met = night.minutes !== null && night.minutes >= settings.sleepTarget - 15;
						const isLast = index === nights.length - 1;
						const color =
							night.minutes === null
								? colors.bgSubtle
								: met
									? colors.statusSuccess
									: isLast
										? colors.statusCaution
										: colors.borderStrong;
						return (
							<View key={night.day} style={styles.column}>
								<View style={styles.track}>
									<View
										style={[
											styles.barFill,
											{
												height: `${Math.max(8, ((night.minutes ?? 0) / max) * 100)}%`,
												backgroundColor: color,
											},
										]}
									/>
								</View>
								<PoText variant="mono13" tone={isLast ? "textWarning" : "textTertiary"}>
									{LETTERS[new Date(`${night.day}T12:00:00`).getDay()]}
								</PoText>
							</View>
						);
					})}
				</View>
				<View style={styles.chips}>
					<MetaChip
						icon="Moon"
						iconTone="accentDefault"
						label={`Bed by ${clockOf(settings.bedAt)} tonight`}
					/>
					<MetaChip
						icon="Sun"
						label={fajr ? `Wake ${clockOf(wake)} for Fajr` : `Wake ${clockOf(wake)}`}
					/>
				</View>
			</Card>
			<Card>
				<CardHead
					title={`Wind down · ${clockOf(settings.windDownAt)}`}
					right={`${doneCount} of ${rows.length} tonight`}
				/>
				<Segments total={rows.length} done={doneCount} doneTone="statusCaution" />
				{rows.map((row) => (
					<CheckRow
						key={row.id}
						label={row.title}
						value={row.id === next?.id ? "Next" : ""}
						valueTone="accentDefault"
						done={row.done}
						tone="textTertiary"
						{...(row.auto ? {} : { onPress: () => void toggleWindDown(log, today, row.id) })}
					/>
				))}
			</Card>
			<PoText variant="eyebrow11" tone="textTertiary" style={styles.label}>
				Alarms
			</PoText>
			<ListCard>
				{fajr ? (
					<ListRow
						title={`Fajr · ${clockOf(wake)}`}
						subtitle="10 minutes before Fajr, soft sound"
						value={settings.alarms.fajr ? "On" : "Off"}
						chevron
						onPress={() => void toggleAlarm("fajr")}
					/>
				) : null}
				<ListRow
					title={`Wind down · ${clockOf(settings.windDownAt)}`}
					subtitle="Starts your night routine"
					value={settings.alarms.windDown ? "On" : "Off"}
					chevron
					onPress={() => void toggleAlarm("windDown")}
				/>
				<ListRow
					title={`Weekend · ${clockOf(settings.weekendWakeAt)}`}
					subtitle="Saturday and Sunday"
					value={settings.alarms.weekend ? "On" : "Off"}
					chevron
					last
					onPress={() => void toggleAlarm("weekend")}
				/>
			</ListCard>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Log last night"
					variant="secondary"
					style={styles.flex}
					onPress={() =>
						setLogging({ bed: clockOf(settings.bedAt), wake: clockOf(settings.wakeAt) })
					}
				/>
				<PillButton
					label={next ? "Start wind down" : "All set tonight"}
					disabled={!next}
					style={styles.flex}
					onPress={() => {
						if (next && !next.auto) {
							haptics.tap();
							void toggleWindDown(log, today, next.id);
						}
					}}
				/>
			</Footer>
			<Sheet
				visible={logging !== null}
				title="Last night"
				onClose={() => setLogging(null)}
				action={{ label: "Save", onPress: saveNight }}
			>
				{logging ? (
					<View style={styles.sheet}>
						<TextField
							label="In bed"
							value={logging.bed}
							onChangeText={(bed) => setLogging({ ...logging, bed })}
							keyboardType="numbers-and-punctuation"
						/>
						<TextField
							label="Woke up"
							value={logging.wake}
							onChangeText={(value) => setLogging({ ...logging, wake: value })}
							keyboardType="numbers-and-punctuation"
							onSubmitEditing={saveNight}
						/>
					</View>
				) : null}
			</Sheet>
		</DailyScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	last: { flexDirection: "row", alignItems: "baseline", gap: 10 },
	chart: { flexDirection: "row", gap: 10, height: 96, paddingTop: 4 },
	target: { position: "absolute", left: 0, right: 0, height: 1 },
	column: { flex: 1, alignItems: "center", gap: 6 },
	track: { flex: 1, width: "100%", justifyContent: "flex-end" },
	barFill: { width: "100%", borderRadius: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	label: { paddingHorizontal: 6 },
	sheet: { gap: 12 },
});
