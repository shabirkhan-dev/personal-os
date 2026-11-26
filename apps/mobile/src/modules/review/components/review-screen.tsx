import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyCard, ProgressBar, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { ToggleRow } from "@/components/ui/toggle-row";
import { useCollection } from "@/lib/db/collection";
import { reminderSettings, saveReminderSettings } from "@/modules/reminders/data/collections";
import { clockLabel, defaultReminderSettings } from "@/modules/reminders/lib/reminder-settings";
import { rescheduleAll } from "@/modules/reminders/services/reschedule-all";
import { usePoTheme } from "@/theme";
import { useReview } from "../hooks/use-review";

/**
 * The week in review: the last seven days from everything logged, with up to three things to
 * try next week. Nothing shows for a module the person didn't use.
 */
export function ReviewScreen() {
	const { colors } = usePoTheme();
	const { review, loading } = useReview();
	const stored = useCollection(reminderSettings);
	const settings = stored.data?.[0] ?? defaultReminderSettings();
	const [notice, setNotice] = useState<string | null>(null);

	const setReminder = (on: boolean) => {
		setNotice(null);
		saveReminderSettings({ ...settings, review: { ...settings.review, on } })
			.then(() => rescheduleAll())
			.catch((error: unknown) => {
				console.error("[review] could not save the reminder", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<ModuleScreen label="Weekly review" tab="today" onHome={() => router.dismissTo("/")}>
			<ScreenTitle eyebrow="The last 7 days" title="Your week" />
			{loading ? null : review.lines.length === 0 ? (
				<EmptyCard
					icon="Filled/Chart"
					title="Nothing logged this week"
					body="Log prayers, meals, money, training or your minimum day, and your week shows up here."
				/>
			) : (
				<>
					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						{review.lines.map((line, index) => (
							<View
								key={line.key}
								accessibilityLabel={`${line.label}: ${line.value}. ${line.detail}`}
								style={[
									styles.line,
									index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderDefault } : null,
								]}
							>
								<View style={styles.head}>
									<PoText variant="row15">{line.label}</PoText>
									<PoText variant="row15" tone="textSecondary">
										{line.value}
									</PoText>
								</View>
								{line.share !== null ? (
									<ProgressBar
										share={line.share}
										tone={line.share >= 0.7 ? "statusSuccess" : "accentDefault"}
									/>
								) : null}
								<PoText variant="meta13" tone="textTertiary">
									{line.detail}
								</PoText>
							</View>
						))}
					</View>

					<SectionLabel>For next week</SectionLabel>
					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						{review.suggestions.map((suggestion, index) => (
							<View
								key={suggestion}
								style={[
									styles.line,
									index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderDefault } : null,
								]}
							>
								<PoText variant="body15">{suggestion}</PoText>
							</View>
						))}
					</View>
				</>
			)}

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<ToggleRow
					title="Remind me on Sundays"
					meta={
						settings.review.on
							? `At ${clockLabel(settings.review.minutes)}. Change it in Reminders.`
							: "Off. A gentle nudge to look back at the week."
					}
					value={settings.review.on}
					onChange={setReminder}
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textWarning" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	card: { paddingHorizontal: 16, borderRadius: 22 },
	line: { gap: 8, paddingVertical: 14 },
	head: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
	pad: { paddingHorizontal: 8 },
});
