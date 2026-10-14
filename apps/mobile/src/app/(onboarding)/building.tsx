import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { PoText } from "@/components/ui/po-text";
import { BuildStatus } from "@/modules/onboarding/components/build-status";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { OsCard } from "@/modules/onboarding/components/os-card";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { moduleOptions } from "@/modules/onboarding/lib/options";
import { reminderPlans } from "@/modules/onboarding/lib/reminders";
import { scheduleReminders } from "@/modules/onboarding/services/reminders.service";
import { useMemberStore } from "@/modules/onboarding/store/member-store";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { rise } from "@/theme";

const STEP_MS = 650;
const HOLD_MS = 900;

/** Makes the member card and sets the reminders that are on. Failures never block the flow. */
async function prepareOs(): Promise<void> {
	try {
		await useMemberStore.getState().ensure();
	} catch (error) {
		console.error("Could not save the member card", error);
	}
	try {
		await scheduleReminders(reminderPlans(useOnboardingStore.getState()));
	} catch (error) {
		console.error("Could not schedule reminders", error);
	}
}

/** 15 Setup 8 · Building: the OS card fills in while modules are added and reminders are set. */
export default function BuildingScreen() {
	const modules = useOnboardingStore((state) => state.modules);
	const member = useMemberStore((state) => state.member);
	const [ready, setReady] = useState(0);
	const [prepared, setPrepared] = useState(false);
	const modulesDone = ready >= modules.length;
	const done = modulesDone && prepared;

	useEffect(() => {
		let live = true;
		void prepareOs().then(() => {
			if (live) setPrepared(true);
		});
		return () => {
			live = false;
		};
	}, []);

	useEffect(() => {
		if (modulesDone) return;
		const timer = setInterval(() => setReady((count) => count + 1), STEP_MS);
		return () => clearInterval(timer);
	}, [modulesDone]);

	useEffect(() => {
		if (!done) return;
		const timer = setTimeout(() => router.replace(onboardingRoutes.planReveal), HOLD_MS);
		return () => clearTimeout(timer);
	}, [done]);

	const adding = moduleOptions.find((option) => option.id === modules[ready])?.label;
	const status = done
		? "Your card is ready"
		: modulesDone
			? "Setting your reminders"
			: `Adding ${adding ?? "modules"} · ${ready} of ${modules.length} modules ready`;

	return (
		<OnboardingScreen glow="accentDefault">
			<View style={styles.spacer} />
			<Animated.View entering={FadeIn.duration(400)} style={styles.text}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Almost there
				</PoText>
				<PoText variant="title30">Your personal card</PoText>
			</Animated.View>
			<View style={styles.gap24} />
			<Animated.View entering={rise(120)}>
				<OsCard member={member} ready={ready} />
			</Animated.View>
			<View style={styles.spacer} />
			<View style={styles.status}>
				<BuildStatus label={status} busy={!done} />
			</View>
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1, minHeight: 20 },
	text: { alignItems: "center", gap: 8, paddingTop: 12 },
	gap24: { height: 24 },
	status: { alignItems: "center" },
});
