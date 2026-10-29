import Constants from "expo-constants";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useSync } from "@/lib/sync/sync-provider";
import { CURRENCY } from "@/lib/money";
import { useAuth } from "@/modules/auth/context/auth-context";
import { FloatingTabBar } from "@/modules/home/components/floating-tab-bar";
import { HomeHeader } from "@/modules/home/components/home-header";
import { OsCard } from "@/modules/onboarding/components/os-card";
import { useMemberStore } from "@/modules/onboarding/store/member-store";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { type ThemePreference, usePoTheme } from "@/theme";
import {
	modulesOnLabel,
	syncState,
	themeLabel,
	type UnitSystem,
	unitsFor,
	unitsLabel,
	unitSystem,
	versionLabel,
	weekStartLabel,
} from "../lib/labels";
import type { WeekStart } from "../lib/profile-document";
import { eraseThisPhone } from "../services/erase-device";
import { exportData } from "../services/export-data";
import { useProfileStore } from "../store/profile-store";
import { DevicesSection } from "./devices-section";
import { EditProfileSheet } from "./edit-profile-sheet";
import { ManageModulesSheet } from "./manage-modules-sheet";
import { OptionSheet } from "./option-sheet";
import { SectionLabel, SettingsCard, SettingsRow, SoonTag } from "./settings-list";
import { useAssistantSettings } from "@/modules/assistant/data/assistant-settings";
import { APPROVAL_LABELS } from "@personal-os/domain/assistant";

type OpenSheet = "modules" | "edit" | "theme" | "currency" | "units" | "week" | null;

const themeOptions = [
	{ value: "system", label: "System", detail: "Follow the phone" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

const unitOptions = [
	{ value: "metric", label: "cm · kg", detail: "Metric" },
	{ value: "imperial", label: "ft · lb", detail: "Imperial" },
] as const;

const weekOptions = [
	{ value: "monday", label: "Monday" },
	{ value: "sunday", label: "Sunday" },
] as const;

const currencyOptions = [{ value: CURRENCY.code, label: CURRENCY.code, detail: "Pakistani rupee" }];

const goToday = () => router.replace("/");

/** Units are saved with the onboarding answers. */
function saveUnits(system: UnitSystem) {
	const store = useOnboardingStore.getState();
	const next = unitsFor(system);
	store.set("heightUnit", next.heightUnit);
	store.set("weightUnit", next.weightUnit);
	useOnboardingProgress
		.getState()
		.persistAnswers()
		.catch((error: unknown) => console.error("Could not save units", error));
}

/** An Alert as a promise: true when the person picks `action`. */
function confirm(title: string, message: string, action: string): Promise<boolean> {
	return new Promise((resolve) => {
		Alert.alert(title, message, [
			{ text: "Cancel", style: "cancel", onPress: () => resolve(false) },
			{ text: action, style: "destructive", onPress: () => resolve(true) },
		]);
	});
}

/** Clears the answers and restarts setup, after a confirm. */
function replayOnboarding() {
	Alert.alert(
		"Replay onboarding?",
		"Your answers are cleared and setup starts again. Your module logs stay on this phone.",
		[
			{ text: "Cancel", style: "cancel" },
			{
				text: "Replay",
				style: "destructive",
				onPress: () => {
					useOnboardingStore.getState().reset();
					useOnboardingProgress
						.getState()
						.restart()
						.catch((error: unknown) => console.error("Could not restart onboarding", error));
				},
			},
		],
	);
}

/** Profile (Figma 163:1583): member card, modules, devices, data, preferences and account. */
export function ProfileScreen() {
	const { colors, preference, setPreference } = usePoTheme();
	const insets = useSafeAreaInsets();
	const auth = useAuth();
	const name = useOnboardingStore((state) => state.name);
	const { settings: assistantSettings } = useAssistantSettings();
	const modules = useOnboardingStore((state) => state.modules);
	const heightUnit = useOnboardingStore((state) => state.heightUnit);
	const weightUnit = useOnboardingStore((state) => state.weightUnit);
	const member = useMemberStore((state) => state.member);
	const weekStart = useProfileStore((state) => state.data.weekStart);
	const updateProfile = useProfileStore((state) => state.update);
	const hydrateProfile = useProfileStore((state) => state.hydrate);
	const [sheet, setSheet] = useState<OpenSheet>(null);
	const [exporting, setExporting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const backup = useSync();

	useEffect(() => {
		useMemberStore
			.getState()
			.ensure()
			.catch((error: unknown) => console.error("Could not load the member card", error));
		hydrateProfile().catch((error: unknown) => console.error("Could not load profile", error));
	}, [hydrateProfile]);

	const close = () => setSheet(null);
	const sync = syncState(auth.status, auth.user?.email ?? null);
	const signedIn = auth.status === "signed-in";

	const runExport = () => {
		if (exporting) return;
		setExporting(true);
		exportData(preference)
			.then((result) => {
				if (result.shared) haptics.success();
			})
			.catch((error: unknown) => {
				console.error("Export failed", error);
				Alert.alert("Export failed", "Your data could not be exported. Please try again.");
			})
			.finally(() => setExporting(false));
	};

	/** Backs up first; if that fails, asks before leaving changes that only live on this phone. */
	const leave = async (erase: boolean) => {
		try {
			await backup.syncNow();
		} catch (error) {
			console.warn("[profile] could not back up before signing out", error);
			const go = await confirm(
				"Not everything is backed up",
				erase
					? "Some changes haven't reached your account and will be lost. Sign out and erase anyway?"
					: "Some changes haven't reached your account yet. They stay on this phone. Sign out anyway?",
				"Sign out",
			);
			if (!go) return;
		}
		await auth.logout();
		if (erase) await eraseThisPhone();
	};

	const signOut = () => {
		Alert.alert(
			"Sign out?",
			"Your changes are backed up first. Keep your plan and logs on this phone, or erase them.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Sign out",
					onPress: () =>
						void leave(false).catch((error: unknown) => console.error("Sign out failed", error)),
				},
				{
					text: "Sign out and erase",
					style: "destructive",
					onPress: () =>
						void leave(true).catch((error: unknown) => console.error("Sign out failed", error)),
				},
			],
		);
	};

	const removeAccount = () => {
		Alert.alert(
			"Delete your account?",
			"This deletes your account and everything backed up to it, and erases this phone. It can't be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete account",
					style: "destructive",
					onPress: () => {
						setDeleting(true);
						auth
							.deleteAccount()
							.then(async () => {
								await eraseThisPhone();
								haptics.success();
							})
							.catch((error: unknown) => {
								console.error("Account deletion failed", error);
								Alert.alert(
									"Couldn't delete your account",
									"Check your connection and try again. Nothing was deleted.",
								);
							})
							.finally(() => setDeleting(false));
					},
				},
			],
		);
	};

	return (
		<View style={[styles.root, { backgroundColor: colors.bgApp }]}>
			<KeyboardAwareScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
				<HomeHeader
					name={name}
					topInset={insets.top}
					label="Profile"
					glow="statusViolet"
					pickerOpen={false}
					onAppsPress={goToday}
					action={{
						icon: "Filled/Edit",
						label: "Edit profile",
						onPress: () => setSheet("edit"),
					}}
				/>
				<View style={styles.content}>
					<OsCard member={member} />

					<SectionLabel>Modules</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Filled/Grid"
							title="Manage modules"
							meta={modulesOnLabel(modules.length)}
							value={`${modules.length} on`}
							onPress={() => setSheet("modules")}
						/>
						<SettingsRow
							icon="Pin"
							title="Pinned order"
							meta="Choose which modules come first"
							accessory={<SoonTag />}
						/>
					</SettingsCard>

					<SectionLabel>Assistant</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Filled/Sparkle"
							iconTone="accentDefault"
							title="Assistant"
							meta={APPROVAL_LABELS[assistantSettings.approval].title}
							onPress={() => router.push("/assistant/settings")}
						/>
						<SettingsRow
							icon="Filled/Calendar"
							title="Past chats"
							meta="Open or delete a conversation"
							onPress={() => router.push("/assistant/history")}
						/>
					</SettingsCard>

					<SectionLabel>Hey OS & devices</SectionLabel>
					<DevicesSection />

					<SectionLabel>Your data</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Download"
							iconTone="statusSuccess"
							tileTone="statusSuccessSubtle"
							title="Export data"
							meta={exporting ? "Preparing…" : "JSON export · everything on this phone"}
							onPress={runExport}
						/>
						<SettingsRow
							icon="Filled/Sparkle"
							title={sync.title}
							meta={sync.meta}
							onPress={
								sync.canSignIn
									? () => router.push("/(home)/sign-in")
									: auth.status === "offline"
										? () => {
												auth
													.retry()
													.catch((error: unknown) =>
														console.error("Could not reach Personal OS", error),
													);
											}
										: undefined
							}
							value={sync.canSignIn ? "Sign in" : auth.status === "offline" ? "Retry" : undefined}
						/>
					</SettingsCard>

					<SectionLabel>Preferences</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Sun"
							iconTone="statusCaution"
							tileTone="statusCautionSubtle"
							title="Theme"
							value={themeLabel(preference)}
							onPress={() => setSheet("theme")}
						/>
						<SettingsRow
							icon="Wallet"
							iconTone="statusCaution"
							tileTone="statusCautionSubtle"
							title="Currency"
							value={CURRENCY.code}
							onPress={() => setSheet("currency")}
						/>
						<SettingsRow
							icon="Lightning"
							title="Units"
							value={unitsLabel(heightUnit, weightUnit)}
							onPress={() => setSheet("units")}
						/>
						<SettingsRow
							icon="Filled/Calendar"
							iconTone="accentDefault"
							tileTone="accentSubtle"
							title="Week starts on"
							value={weekStartLabel(weekStart)}
							onPress={() => setSheet("week")}
						/>
					</SettingsCard>

					<SectionLabel>Account</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Filled/Edit"
							iconTone="accentDefault"
							tileTone="accentSubtle"
							title="Photo and name"
							meta={name || "Add your name and a photo"}
							onPress={() => setSheet("edit")}
						/>
						{signedIn ? (
							<SettingsRow
								icon="Logout"
								iconTone="textDanger"
								title="Sign out"
								titleTone="textDanger"
								meta={auth.user?.email}
								onPress={signOut}
							/>
						) : (
							<SettingsRow
								icon="Filled/User"
								title="Sign in"
								meta="Back up your plan to your account"
								onPress={() => router.push("/(home)/sign-in")}
							/>
						)}
						<SettingsRow
							icon="Filled/Play"
							title="Replay onboarding"
							meta="Set up Personal OS again"
							onPress={replayOnboarding}
						/>
						{signedIn ? (
							<SettingsRow
								icon="Line/Close"
								iconTone="textDanger"
								title={deleting ? "Deleting…" : "Delete account"}
								titleTone="textDanger"
								meta="Removes your account and all of its data"
								onPress={deleting ? undefined : removeAccount}
							/>
						) : null}
					</SettingsCard>

					<View style={styles.version}>
						<PoText variant="mono13" tone="textTertiary">
							{versionLabel(Constants.expoConfig?.version)}
						</PoText>
					</View>
				</View>
			</KeyboardAwareScrollView>

			<FloatingTabBar
				active="profile"
				bottomInset={insets.bottom}
				onTodayPress={goToday}
				onAreasPress={goToday}
			/>

			<ManageModulesSheet visible={sheet === "modules"} onClose={close} />
			<EditProfileSheet visible={sheet === "edit"} onClose={close} />
			<OptionSheet<ThemePreference>
				visible={sheet === "theme"}
				title="Theme"
				options={themeOptions}
				value={preference}
				onChange={setPreference}
				onClose={close}
			/>
			<OptionSheet
				visible={sheet === "currency"}
				title="Currency"
				options={currencyOptions}
				value={CURRENCY.code}
				onChange={() => undefined}
				onClose={close}
				note="More currencies soon."
			/>
			<OptionSheet<UnitSystem>
				visible={sheet === "units"}
				title="Units"
				options={unitOptions}
				value={unitSystem(heightUnit, weightUnit)}
				onChange={saveUnits}
				onClose={close}
			/>
			<OptionSheet<WeekStart>
				visible={sheet === "week"}
				title="Week starts on"
				options={weekOptions}
				value={weekStart}
				onChange={(next) => updateProfile((current) => ({ ...current, weekStart: next }))}
				onClose={close}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { gap: 12, paddingHorizontal: 16 },
	version: { alignItems: "center", paddingTop: 8 },
});
