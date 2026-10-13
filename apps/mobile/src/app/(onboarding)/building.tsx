import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { BuildStatus, PersonalCard } from "@/modules/onboarding/components/personal-card";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { moduleOptions } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";

const STEP_MS = 750;
const HOLD_MS = 900;

/** 15 Setup 8 · Building: the personal card fills in while modules are added. */
export default function BuildingScreen() {
	const modules = useOnboardingStore((state) => state.modules);
	const [ready, setReady] = useState(0);
	const done = ready >= modules.length;

	useEffect(() => {
		if (done) {
			const timer = setTimeout(() => router.replace(onboardingRoutes.planReveal), HOLD_MS);
			return () => clearTimeout(timer);
		}
		const timer = setInterval(() => setReady((count) => count + 1), STEP_MS);
		return () => clearInterval(timer);
	}, [done]);

	const adding = moduleOptions.find((option) => option.id === modules[ready])?.label;
	const status = done
		? "Your plan is ready"
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
			<Animated.View entering={FadeInDown.duration(520).delay(120)}>
				<PersonalCard ready={ready} />
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
