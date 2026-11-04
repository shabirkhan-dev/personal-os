import Constants from "expo-constants";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { showDialog } from "@/components/ui/dialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useSync } from "@/lib/sync/sync-provider";
import { useAuth } from "@/modules/auth/context/auth-context";
import { FloatingTabBar } from "@/modules/home/components/floating-tab-bar";
import { HeaderBar, HomeHeader } from "@/modules/home/components/home-header";
import { StickyBar, scrolledPast } from "@/components/ui/sticky-bar";
import { insightsTabPress } from "@/modules/home/components/insights-switcher";
import { openAreas } from "@/modules/home/store/areas-picker";
import { OsCard } from "@/modules/onboarding/components/os-card";
import { useMemberStore } from "@/modules/onboarding/store/member-store";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { modulesOnLabel, syncState, versionLabel } from "../lib/labels";
import { eraseThisPhone } from "../services/erase-device";
import { exportData } from "../services/export-data";
import { useProfileStore } from "../store/profile-store";
import { DevicesSection } from "./devices-section";
import { EditProfileSheet } from "./edit-profile-sheet";
import { ManageModulesSheet } from "./manage-modules-sheet";
import { SectionLabel, SettingsCard, SettingsRow } from "./settings-list";
import { useAssistantSettings } from "@/modules/assistant/data/assistant-settings";
import { APPROVAL_LABELS } from "@personal-os/domain/assistant";

type OpenSheet = "modules" | "edit" | null;

const goToday = () => router.dismissTo("/");

/** A confirm dialog as a promise: true when the person picks `action`. */
function confirm(title: string, message: string, action: string): Promise<boolean> {
	return new Promise((resolve) => {
		showDialog(title, message, [
			{ text: "Cancel", style: "cancel", onPress: () => resolve(false) },
			{ text: action, style: "destructive", onPress: () => resolve(true) },
		]);
	});
}

/** Clears the answers and restarts setup, after a confirm. */
function replayOnboarding() {
	showDialog(
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
	const { colors, preference } = usePoTheme();
	const insets = useSafeAreaInsets();
	const auth = useAuth();
	const name = useOnboardingStore((state) => state.name);
	const { settings: assistantSettings } = useAssistantSettings();
	const modules = useOnboardingStore((state) => state.modules);
	const member = useMemberStore((state) => state.member);
	const hydrateProfile = useProfileStore((state) => state.hydrate);
	const [sheet, setSheet] = useState<OpenSheet>(null);
	const [solid, setSolid] = useState(false);
	const headerAction = {
		icon: "Filled/Edit" as const,
		label: "Edit profile",
		onPress: () => setSheet("edit"),
	};
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
				showDialog("Export failed", "Your data could not be exported. Please try again.");
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
		showDialog(
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
		showDialog(
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
								showDialog(
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
			<KeyboardAwareScrollView
				contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
				scrollEventThrottle={16}
				onScroll={(event) => setSolid(scrolledPast(event.nativeEvent.contentOffset.y))}
			>
				<HomeHeader
					name={name}
					topInset={insets.top}
					label="Profile"
					glow="statusViolet"
					pickerOpen={false}
					onAppsPress={openAreas}
					action={headerAction}
					bar="spacer"
				/>
				<View style={styles.content}>
					<OsCard member={member} />

					<SectionLabel>Modules</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Filled/Grid"
							title="Manage modules"
							meta={modulesOnLabel(modules.length)}
							onPress={() => setSheet("modules")}
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

					<SectionLabel>Settings</SectionLabel>
					<SettingsCard>
						<SettingsRow
							icon="Settings"
							title="Settings"
							meta="Height, weight, birthday, units, theme"
							onPress={() => router.push("/settings")}
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
			<StickyBar topInset={insets.top} solid={solid}>
				<HeaderBar
					name={name}
					label="Profile"
					pickerOpen={false}
					onAppsPress={openAreas}
					action={headerAction}
				/>
			</StickyBar>

			<FloatingTabBar
				active="profile"
				bottomInset={insets.bottom}
				onTodayPress={goToday}
				onInsightsPress={insightsTabPress()}
			/>

			<ManageModulesSheet visible={sheet === "modules"} onClose={close} />
			<EditProfileSheet visible={sheet === "edit"} onClose={close} />
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { gap: 12, paddingHorizontal: 16 },
	version: { alignItems: "center", paddingTop: 8 },
});
