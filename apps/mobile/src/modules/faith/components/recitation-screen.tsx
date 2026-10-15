import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import {
	Footer,
	ListCard,
	ListRow,
	MetaChip,
	ScreenTitle,
	SectionLabel,
	Segments,
} from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { useSpeaker } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import { addRecitation, saveSettings } from "../data/faith-actions";
import { elapsedMinutes, useRecitationTimer } from "../hooks/recitation-timer";
import { useFaithUi } from "../hooks/faith-ui-store";
import { useFaith } from "../hooks/use-faith";
import { AYAH_SOURCE } from "../lib/ayahs";
import { ayahOfTheDay, recitationStreak, recitationWeek, recitedOn } from "../lib/faith-math";
import { faithRoutes } from "../navigation";
import { AyahCard } from "./ayah-card";
import { FaithScreen } from "./faith-screen";

/** Quran recitation: the five-day week, a timer that keeps running off-screen, and what's next. */
export function RecitationScreen() {
	const { colors } = usePoTheme();
	const { settings, sessions } = useFaith();
	const now = useNow(1000);
	const timer = useRecitationTimer();
	const speaker = useSpeaker();
	const ayahOffset = useFaithUi((state) => state.ayahOffset);
	const [planning, setPlanning] = useState(false);
	const [saved, setSaved] = useState<string | null>(null);

	const week = recitationWeek(sessions, now);
	const doneDays = week.filter((day) => day.done).length;
	const today = recitedOn(sessions, dayKey(now));
	const streak = recitationStreak(sessions, now);
	const elapsed = elapsedMinutes(timer, now.getTime());
	const leftMs = Math.max(0, timer.targetMinutes * 60_000 - elapsed * 60_000);
	const ayah = ayahOfTheDay(now, ayahOffset);

	const finish = () => {
		const minutes = timer.finish();
		speaker.stop();
		if (minutes < 0.5) {
			setSaved("Under a minute, so nothing was saved.");
			return;
		}
		haptics.success();
		void addRecitation(minutes)
			.then(() =>
				setSaved(
					`${Math.round(minutes)} minutes added. ${streak + (today > 0 ? 0 : 1)}-day streak.`,
				),
			)
			.catch((error: unknown) => {
				console.error("[faith] could not save recitation", error);
				setSaved("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<FaithScreen
			action={{ icon: "Filled/Edit", label: "Change plan", onPress: () => setPlanning(true) }}
		>
			<ScreenTitle
				eyebrow={`${settings.recitationMinutes} min a day · after Fajr`}
				title="Quran recitation"
			>
				<MetaChip icon="Lightning" iconTone="statusCaution" label={`${streak}-day streak`} />
				<MetaChip icon="Clock" label={`${Math.round(today)} min today`} />
				<MetaChip
					icon={settings.readAloud ? "Line/Check" : "Mic"}
					label={settings.readAloud ? "Read aloud" : "Read aloud off"}
					onPress={() =>
						void saveSettings({ ...settings, readAloud: !settings.readAloud }).catch(
							(error: unknown) => console.error("[faith] could not save", error),
						)
					}
				/>
			</ScreenTitle>

			{timer.active ? (
				<View
					style={[
						styles.timer,
						{ backgroundColor: colors.bgSurface, borderColor: colors.statusViolet },
					]}
				>
					<PoText variant="eyebrow11" tone="textTertiary">
						{timer.runningSince === null ? "Paused" : "Reciting"}
					</PoText>
					<PoText variant="hero40" accessibilityLiveRegion="polite">
						{clock(leftMs)}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{leftMs === 0
							? "Time's up. Finish when you reach a stopping point."
							: `${Math.floor(elapsed)} of ${timer.targetMinutes} minutes`}
					</PoText>
					<View style={styles.row}>
						<PillButton
							label={timer.runningSince === null ? "Resume" : "Pause"}
							variant="secondary"
							onPress={timer.runningSince === null ? timer.resume : timer.pause}
							style={styles.flex}
						/>
						<PillButton label="Finish" onPress={finish} style={styles.flex} />
					</View>
				</View>
			) : null}
			{saved ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{saved}
				</PoText>
			) : null}

			{timer.active ? (
				<AyahCard
					eyebrow={`Start with · ${ayah.surah} ${ayah.id}`}
					arabic={ayah.arabic}
					translation={ayah.translation}
					speaking={speaker.speaking === ayah.id}
					canSpeak={speaker.available}
					onRecite={() =>
						speaker.speaking === ayah.id
							? speaker.stop()
							: speaker.speak(ayah.id, [
									{ text: ayah.arabic, lang: "ar", rate: 0.8 },
									{ text: ayah.translation },
								])
					}
					secondary={{ label: "Another", onPress: () => useFaithUi.getState().nextAyah() }}
				/>
			) : null}

			<View
				style={[
					styles.week,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={styles.row}>
					<PoText variant="title18" style={styles.flex}>
						This week
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{doneDays} of 5 days
					</PoText>
				</View>
				<Segments total={5} done={doneDays} doneTone="statusViolet" />
				{week.map((day) => (
					<View key={day.day} style={styles.dayRow}>
						<View
							style={[
								styles.check,
								day.done
									? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
									: { borderColor: colors.borderStrong },
							]}
						>
							{day.done ? <Icon name="Check bold" size={12} color={colors.textOnAccent} /> : null}
						</View>
						<View style={styles.flex}>
							<PoText variant="row15" tone={day.done ? "textSecondary" : "textPrimary"}>
								{day.weekday} · {day.title}
							</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{day.detail}
								{day.today ? " · today" : ""}
							</PoText>
						</View>
						{day.today && !day.done ? (
							<PoText variant="meta13" tone="accentDefault">
								Today
							</PoText>
						) : null}
					</View>
				))}
			</View>

			<SectionLabel>Up next</SectionLabel>
			<ListCard>
				<ListRow
					title="Learn by heart"
					subtitle="A short surah, a few lines each week"
					value="Start"
					chevron
					onPress={faithRoutes.grow}
				/>
				<ListRow
					title="Words and duas"
					subtitle="Flashcards, a few minutes a day"
					value="Review"
					chevron
					onPress={faithRoutes.flashcards}
				/>
				<ListRow
					title="Study your beliefs"
					subtitle="One topic a week, with notes"
					value="Later"
					chevron
					last
					onPress={faithRoutes.grow}
				/>
			</ListCard>

			<PoText variant="meta13" tone="textTertiary" style={styles.notice}>
				{AYAH_SOURCE}
			</PoText>

			{timer.active ? null : (
				<Footer>
					<PillButton
						label="Change plan"
						variant="secondary"
						onPress={() => setPlanning(true)}
						style={styles.flex}
					/>
					<PillButton
						label={`Start ${settings.recitationMinutes} min`}
						onPress={() => {
							haptics.tap();
							setSaved(null);
							timer.start(settings.recitationMinutes);
							if (settings.readAloud) {
								speaker.speak(ayah.id, [
									{ text: ayah.arabic, lang: "ar", rate: 0.8 },
									{ text: ayah.translation },
								]);
							}
						}}
						style={styles.flex}
					/>
				</Footer>
			)}

			<Sheet
				visible={planning}
				title="Your plan"
				onClose={() => setPlanning(false)}
				action={{ label: "Done", onPress: () => setPlanning(false) }}
			>
				<ChoiceChips
					label="Minutes a day"
					options={[5, 10, 15, 20, 30].map((minutes) => ({
						value: String(minutes),
						label: `${minutes} min`,
					}))}
					value={String(settings.recitationMinutes)}
					onChange={(value) =>
						void saveSettings({ ...settings, recitationMinutes: Number(value) }).catch(
							(error: unknown) => console.error("[faith] could not save the plan", error),
						)
					}
				/>
				<PoText variant="meta13" tone="textSecondary">
					Right after Fajr is easiest to keep. Say “recited 15 min” in the ask bar to log time you
					read away from the app.
				</PoText>
			</Sheet>
		</FaithScreen>
	);
}

function clock(ms: number): string {
	const seconds = Math.ceil(ms / 1000);
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	notice: { paddingHorizontal: 6 },
	timer: { alignItems: "center", gap: 8, padding: 20, borderRadius: 28, borderWidth: 1.5 },
	week: { gap: 14, padding: 18, borderRadius: 28, borderWidth: 1 },
	dayRow: { flexDirection: "row", alignItems: "center", gap: 14 },
	check: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
});
