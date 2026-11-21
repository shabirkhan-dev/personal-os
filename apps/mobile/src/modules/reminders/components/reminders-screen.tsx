import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { useCollection } from "@/lib/db/collection";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { careSteps } from "@/modules/care/data/collections";
import type { ReminderId } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import {
	SectionLabel,
	SettingsCard,
	SettingsRow,
} from "@/modules/profile/components/settings-list";
import { usePoTheme } from "@/theme";
import { reminderSettings, saveReminderSettings } from "../data/collections";
import {
	clockLabel,
	defaultReminderSettings,
	FOLLOW_UP_CHOICES,
	type ReminderSettings,
	SNOOZE_CHOICES,
	WATER_EVERY_CHOICES,
} from "../lib/reminder-settings";
import {
	forgetPlans,
	resetCategories,
	sendTestReminder,
	type Upcoming,
	upcomingReminders,
} from "../services/reminder-engine";
import { rescheduleAll } from "../services/reschedule-all";
import { TimeStepper } from "./time-stepper";

type Health = { notifications: boolean; canAsk: boolean; exact: boolean };

const SETUP_ROWS: { id: ReminderId; title: string; meta: string }[] = [
	{ id: "morning-plan", title: "Morning plan", meta: "15 minutes after you wake" },
	{ id: "evening-check-in", title: "Evening check-in", meta: "30 minutes before bed" },
	{ id: "workout-nudge", title: "Workout nudge", meta: "Mon, Wed and Fri at 18:30" },
];

async function readHealth(): Promise<Health> {
	if (Platform.OS === "web") return { notifications: false, canAsk: false, exact: false };
	const permission = await Notifications.getPermissionsAsync();
	const exact =
		Platform.OS === "android"
			? (await Notifications.getExactAlarmPermissionsAsync()).granted
			: true;
	return { notifications: permission.granted, canAsk: permission.canAskAgain, exact };
}

function whenLabel(at: Date, now: Date): string {
	const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const diff = Math.round(
		(new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() - day.getTime()) /
			86_400_000,
	);
	const time = clockLabel(at.getHours() * 60 + at.getMinutes());
	if (diff === 0) return `Today ${time}`;
	if (diff === 1) return `Tomorrow ${time}`;
	return `${at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}

/**
 * Settings · Reminders: checks that reminders can arrive on time on this phone (permission, exact
 * alarms, battery), sends a test, shows what's coming, and sets the reminders that belong to no
 * single module (Care routines, water, follow-ups, snooze).
 */
export function RemindersScreen() {
	const { colors } = usePoTheme();
	const stored = useCollection(reminderSettings);
	const settings = stored.data?.[0] ?? defaultReminderSettings();
	const steps = useCollection(careSteps);
	const hasRoutine = (steps.data?.length ?? 0) > 0;
	const setupReminders = useOnboardingStore((state) => state.reminders);
	const [health, setHealth] = useState<Health | null>(null);
	const [upcoming, setUpcoming] = useState<{ total: number; next: Upcoming[] }>({
		total: 0,
		next: [],
	});
	const [notice, setNotice] = useState<string | null>(null);

	const refresh = useCallback(() => {
		readHealth()
			.then(setHealth)
			.catch((error: unknown) => console.warn("[reminders] could not read permissions", error));
		upcomingReminders(5)
			.then(setUpcoming)
			.catch((error: unknown) => console.warn("[reminders] could not list reminders", error));
	}, []);

	useEffect(() => {
		refresh();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") refresh();
		});
		return () => subscription.remove();
	}, [refresh]);

	const replan = () => {
		forgetPlans();
		rescheduleAll()
			.then(refresh)
			.catch((error: unknown) => console.warn("[reminders] could not plan reminders", error));
	};

	const update = (change: Partial<ReminderSettings>) => {
		if (change.snoozeMinutes !== undefined) resetCategories();
		saveReminderSettings({ ...settings, ...change })
			.then(replan)
			.catch((error: unknown) => {
				console.error("[reminders] could not save", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	const allowNotifications = async () => {
		if (health && !health.canAsk) {
			await Linking.openSettings();
			return;
		}
		const asked = await Notifications.requestPermissionsAsync();
		if (asked.granted) {
			haptics.success();
			replan();
		}
		refresh();
	};

	const allowExact = async () => {
		try {
			await Notifications.requestExactAlarmPermissionsAsync();
		} catch (error) {
			console.warn("[reminders] could not open the exact alarm setting", error);
			await Linking.openSettings();
		}
		replan();
	};

	const test = () => {
		sendTestReminder(5)
			.then((sent) =>
				setNotice(
					sent
						? "A test reminder arrives in 5 seconds. Lock your phone to see it as it will really look."
						: "Turn notifications on first.",
				),
			)
			.catch((error: unknown) => {
				console.error("[reminders] test failed", error);
				setNotice("The test couldn't be scheduled. Try again.");
			});
	};

	const toggleSetup = (id: ReminderId) => {
		useOnboardingStore.getState().toggleReminder(id);
		useOnboardingProgress
			.getState()
			.persistAnswers()
			.then(replan)
			.catch((error: unknown) => console.error("[reminders] could not save", error));
	};

	const now = useNow();
	const ready = health ? health.notifications && health.exact : true;

	return (
		<ModuleScreen label="Reminders" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={[styles.hero, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="eyebrow11" tone={ready ? "statusSuccess" : "statusCaution"}>
					{ready ? "READY ON THIS PHONE" : "NEEDS A MINUTE OF SETUP"}
				</PoText>
				<PoText variant="title30">
					{upcoming.total > 0
						? `${upcoming.total} reminder${upcoming.total === 1 ? "" : "s"} set`
						: "No reminders set yet"}
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Important reminders go off like an alarm, can be snoozed, and are put back after a
					restart. They're topped up in the background, so they keep coming even when you don't open
					the app.
				</PoText>
				<PillButton label="Send a test reminder" variant="secondary" onPress={test} />
				{notice ? (
					<PoText variant="meta13" tone="textSecondary">
						{notice}
					</PoText>
				) : null}
			</View>

			{Platform.OS !== "web" ? (
				<>
					<SectionLabel>Make sure they arrive</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Filled/Bell"
							title="Notifications"
							meta={health?.notifications ? "Allowed" : "Off: reminders can't show"}
							value={health?.notifications ? "On" : "Turn on"}
							onPress={health?.notifications ? undefined : () => void allowNotifications()}
						/>
						{Platform.OS === "android" ? (
							<SettingsRow
								icon="Clock"
								title="Alarms and reminders"
								meta={
									health?.exact
										? "Allowed: on the minute, even in battery saver"
										: "Off: Android may delay reminders"
								}
								value={health?.exact ? "On" : "Allow"}
								onPress={health?.exact ? undefined : () => void allowExact()}
							/>
						) : null}
						{Platform.OS === "android" ? (
							<SettingsRow
								icon="Lightning"
								title="Battery"
								meta="On Xiaomi, Oppo, Vivo, Samsung and others, set Battery to Unrestricted"
								value="Open"
								onPress={() => void Linking.openSettings()}
							/>
						) : null}
					</SettingsCard>
				</>
			) : null}

			{upcoming.next.length > 0 ? (
				<>
					<SectionLabel>Coming up</SectionLabel>
					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						{upcoming.next.map((item) => (
							<View key={item.id} style={styles.upcoming}>
								<PoText variant="row15" numberOfLines={1} style={styles.flex}>
									{item.title}
								</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{whenLabel(item.at, now)}
								</PoText>
							</View>
						))}
					</View>
				</>
			) : null}

			<SectionLabel>Care routines</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				{hasRoutine ? null : (
					<PoText variant="meta13" tone="textSecondary">
						Add a step to your Care routine first; these reminders start once you have one.
					</PoText>
				)}
				<ToggleLine
					title="Morning routine"
					value={settings.care.morning.on}
					onChange={(on) =>
						update({ care: { ...settings.care, morning: { ...settings.care.morning, on } } })
					}
				/>
				{settings.care.morning.on ? (
					<TimeStepper
						label="At"
						minutes={settings.care.morning.minutes}
						onChange={(minutes) =>
							update({ care: { ...settings.care, morning: { ...settings.care.morning, minutes } } })
						}
					/>
				) : null}
				<ToggleLine
					title="Night routine"
					value={settings.care.night.on}
					onChange={(on) =>
						update({ care: { ...settings.care, night: { ...settings.care.night, on } } })
					}
				/>
				{settings.care.night.on ? (
					<TimeStepper
						label="At"
						minutes={settings.care.night.minutes}
						onChange={(minutes) =>
							update({ care: { ...settings.care, night: { ...settings.care.night, minutes } } })
						}
					/>
				) : null}
			</View>

			<SectionLabel>Water</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<ToggleLine
					title="Remind me to drink"
					meta="With a Log a glass button"
					value={settings.water.on}
					onChange={(on) => update({ water: { ...settings.water, on } })}
				/>
				{settings.water.on ? (
					<>
						<View style={styles.chips}>
							{WATER_EVERY_CHOICES.map((every) => (
								<FilterChip
									key={every}
									label={every % 60 === 0 ? `Every ${every / 60} h` : `Every ${every} min`}
									selected={settings.water.every === every}
									onPress={() => update({ water: { ...settings.water, every } })}
								/>
							))}
						</View>
						<TimeStepper
							label="From"
							minutes={settings.water.from}
							onChange={(from) => update({ water: { ...settings.water, from } })}
						/>
						<TimeStepper
							label="Until"
							minutes={settings.water.to}
							onChange={(to) => update({ water: { ...settings.water, to } })}
						/>
					</>
				) : null}
			</View>

			<SectionLabel>Medicines</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<ToggleLine
					title="Ask again if not marked"
					meta="A second reminder when a dose isn't marked taken"
					value={settings.followUps}
					onChange={(followUps) => update({ followUps })}
				/>
				{settings.followUps ? (
					<View style={styles.chips}>
						{FOLLOW_UP_CHOICES.map((minutes) => (
							<FilterChip
								key={minutes}
								label={minutes === 60 ? "After 1 h" : `After ${minutes} min`}
								selected={settings.followUpMinutes === minutes}
								onPress={() => update({ followUpMinutes: minutes })}
							/>
						))}
					</View>
				) : null}
				<PillButton
					label="Medicine times"
					variant="secondary"
					onPress={() => router.push("/health/medicines")}
				/>
			</View>

			<SectionLabel>Snooze</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<View style={styles.chips}>
					{SNOOZE_CHOICES.map((minutes) => (
						<FilterChip
							key={minutes}
							label={`${minutes} min`}
							selected={settings.snoozeMinutes === minutes}
							onPress={() => update({ snoozeMinutes: minutes })}
						/>
					))}
				</View>
				{Platform.OS === "android" ? (
					<ToggleLine
						title="Alarm-style delivery"
						meta="Prayers, medicines, Care and wake-ups ring on the minute, like an alarm clock"
						value={settings.exact}
						onChange={(exact) => update({ exact })}
					/>
				) : null}
			</View>

			<SectionLabel>Your day</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				{SETUP_ROWS.map((row) => (
					<ToggleLine
						key={row.id}
						title={row.title}
						meta={row.meta}
						value={setupReminders[row.id]}
						onChange={() => toggleSetup(row.id)}
					/>
				))}
			</View>
			<PoText variant="meta13" tone="textTertiary" style={styles.note}>
				Prayer reminders are set in Faith, and wake-up and wind-down alarms in Daily life → Sleep.
			</PoText>
		</ModuleScreen>
	);
}

function ToggleLine({
	title,
	meta,
	value,
	onChange,
}: {
	title: string;
	meta?: string;
	value: boolean;
	onChange: (value: boolean) => void;
}) {
	// The whole row toggles, not only the switch.
	return (
		<View style={styles.toggle}>
			<Pressable
				accessibilityRole="switch"
				accessibilityState={{ checked: value }}
				onPress={() => {
					haptics.select();
					onChange(!value);
				}}
				style={styles.flex}
			>
				<PoText variant="row15">{title}</PoText>
				{meta ? (
					<PoText variant="meta13" tone="textTertiary">
						{meta}
					</PoText>
				) : null}
			</Pressable>
			<Toggle value={value} onChange={onChange} accessibilityLabel={title} />
		</View>
	);
}

const styles = StyleSheet.create({
	hero: { gap: 10, padding: 20, borderRadius: 24 },
	card: { gap: 14, padding: 16, borderRadius: 20 },
	upcoming: { flexDirection: "row", alignItems: "center", gap: 12 },
	toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
	flex: { flex: 1, minWidth: 0, gap: 2 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	note: { paddingHorizontal: 8 },
});
