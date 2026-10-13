import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/modules/auth/context/auth-context";
import { AskBar } from "@/modules/home/components/ask-bar";
import { FloatingTabBar } from "@/modules/home/components/floating-tab-bar";
import { HomeHeader } from "@/modules/home/components/home-header";
import { ModulePicker } from "@/modules/home/components/module-picker";
import { MoneyCard } from "@/modules/home/components/money-card";
import { UpcomingList } from "@/modules/home/components/upcoming-list";
import {
	moduleStatuses,
	nowLabel,
	periodLabel,
	todayItems,
	upcoming,
} from "@/modules/home/lib/today";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePlan } from "@/modules/onboarding/store/use-plan";
import { usePoTheme } from "@/theme";

const HEADER_HEIGHT = 76;

/** Re-renders once a minute so "Now" and "Next · in …" stay current. */
function useNow(): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(timer);
	}, []);
	return now;
}

function suggestionsFor(modules: readonly ModuleId[]): string[] {
	const suggestions: string[] = [];
	if (modules.includes("food")) suggestions.push("Log a meal");
	if (modules.includes("finance")) suggestions.push("Add expense");
	if (modules.includes("workout")) suggestions.push("Start workout");
	suggestions.push("Plan tomorrow");
	return suggestions.slice(0, 3);
}

/** Home · Overview (Figma page "Home"). */
export default function HomeScreen() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const now = useNow();
	const plan = usePlan();
	const { answers } = plan;
	const toggleModule = useOnboardingStore((state) => state.toggleModule);
	const resetAnswers = useOnboardingStore((state) => state.reset);
	const { persistAnswers, restart } = useOnboardingProgress();
	const [pickerOpen, setPickerOpen] = useState(false);
	const auth = useAuth();

	const items = useMemo(
		() => todayItems(plan.input, answers.reminders),
		[plan.input, answers.reminders],
	);
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	const next = useMemo(() => upcoming(items, nowMinutes), [items, nowMinutes]);
	const modules = useMemo(() => moduleStatuses(plan.input, items), [plan.input, items]);

	const openProfileMenu = () => {
		const account =
			auth.status === "signed-in" && auth.user
				? {
						text: "Sign out",
						style: "destructive" as const,
						onPress: () => {
							auth.logout().catch(() => undefined);
						},
					}
				: { text: "Sign in", onPress: () => router.push("/(home)/sign-in") };
		const detail =
			auth.status === "signed-in" && auth.user
				? `Signed in as ${auth.user.email}`
				: auth.status === "offline"
					? "Can't reach Personal OS. Your plan is saved on this phone."
					: "Not signed in. Your plan is saved on this phone.";
		Alert.alert(answers.name.trim() || "Your profile", detail, [
			account,
			{
				text: "Replay onboarding",
				onPress: () => {
					resetAnswers();
					restart().catch(() => undefined);
				},
			},
			{ text: "Cancel", style: "cancel" },
		]);
	};

	const addModule = (id: ModuleId) => {
		toggleModule(id);
		persistAnswers().catch(() => undefined);
	};

	return (
		<View style={[styles.root, { backgroundColor: colors.bgApp }]}>
			<ScrollView
				contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
				keyboardShouldPersistTaps="handled"
			>
				<HomeHeader
					name={answers.name}
					topInset={insets.top}
					pickerOpen={pickerOpen}
					onAppsPress={() => setPickerOpen((open) => !open)}
					onProfilePress={openProfileMenu}
					onNotificationsPress={() => Alert.alert("Notifications", "You're all caught up.")}
				/>
				<View style={styles.content}>
					{answers.modules.includes("finance") ? <MoneyCard period={periodLabel(now)} /> : null}
					<AskBar
						suggestions={suggestionsFor(answers.modules)}
						onSubmit={() =>
							Alert.alert(
								"Assistant",
								"Logging and asking arrive with your account. Your note was not saved.",
							)
						}
					/>
					<UpcomingList upcoming={next} now={nowLabel(now)} />
				</View>
			</ScrollView>
			{pickerOpen ? (
				<ModulePicker
					top={insets.top + HEADER_HEIGHT - 2}
					modules={modules}
					onClose={() => setPickerOpen(false)}
					onAddModule={addModule}
				/>
			) : null}
			<FloatingTabBar
				bottomInset={insets.bottom}
				onAreasPress={() => setPickerOpen(true)}
				onProfilePress={openProfileMenu}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	scroll: { flexGrow: 1 },
	content: { gap: 16, paddingHorizontal: 16 },
});
