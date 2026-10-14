import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { OsCard } from "@/modules/onboarding/components/os-card";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { memberLabel } from "@/modules/onboarding/lib/member-card";
import { goBack } from "@/modules/onboarding/lib/navigation";
import { useMemberStore } from "@/modules/onboarding/store/member-store";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { pop, rise } from "@/theme";
import { haptics } from "@/lib/haptics";

/** 18 All set: the member card, then into the app. */
export default function AllSetScreen() {
	const name = useOnboardingStore((state) => state.name);
	const complete = useOnboardingStore((state) => state.complete);
	const markCompleted = useOnboardingProgress((state) => state.markCompleted);
	const member = useMemberStore((state) => state.member);
	const ensureMember = useMemberStore((state) => state.ensure);
	const [opening, setOpening] = useState(false);

	// Resuming here skips Building, which normally makes the card.
	useEffect(() => {
		ensureMember().catch((error: unknown) =>
			console.error("Could not load the member card", error),
		);
	}, [ensureMember]);

	const openOs = async () => {
		setOpening(true);
		complete();
		haptics.success();
		try {
			await markCompleted();
			router.replace("/");
		} catch (error) {
			console.error("Could not finish onboarding", error);
			setOpening(false);
		}
	};

	const share = () => {
		const who = name.trim() || "I";
		Share.share({
			message: `${who === "I" ? "I'm" : `${who} is`} on Personal OS · ${memberLabel(member)}`,
		}).catch((error: unknown) => console.error("Could not share the card", error));
	};

	return (
		<OnboardingScreen glow="statusViolet">
			<SetupTop onBack={() => goBack(onboardingRoutes.allSet)} />
			<View style={styles.spacer} />
			<Animated.View entering={rise()} style={styles.text}>
				<PoText variant="eyebrow11" tone="textTertiary">
					All set
				</PoText>
				<PoText variant="title30">Welcome to your OS</PoText>
				<PoText variant="body15" tone="textSecondary" style={styles.center}>
					Here's your card. Your plan, modules and devices live here.
				</PoText>
			</Animated.View>
			<View style={styles.gap26} />
			<Animated.View entering={pop(160)}>
				<OsCard member={member} />
			</Animated.View>
			<View style={styles.gap28} />
			<View style={styles.footer}>
				<PillButton label="Open my OS" disabled={opening} onPress={() => void openOs()} />
				<PillButton variant="ghost" label="Share my card" onPress={share} />
			</View>
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1 },
	text: { alignItems: "center", gap: 8 },
	center: { textAlign: "center" },
	gap26: { height: 26 },
	gap28: { height: 28 },
	footer: { gap: 8 },
});
