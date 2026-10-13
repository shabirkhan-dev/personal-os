import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LogoMark } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

// Account creation is not wired to the API yet; every option continues to the
// welcome card so the flow can be reviewed end to end.
const continueToAllSet = () => router.push(onboardingRoutes.allSet);

/** 17 Sign in */
export default function SignInScreen() {
	return (
		<OnboardingScreen
			glow="accentDefault"
			footer={
				<View style={styles.footer}>
					<PillButton label="Continue with Apple" onPress={continueToAllSet} />
					<PillButton variant="secondary" label="Continue with Google" onPress={continueToAllSet} />
					<PillButton variant="ghost" label="Use email instead" onPress={continueToAllSet} />
					<PoText variant="meta13" tone="textTertiary" style={styles.center}>
						By continuing you agree to the Terms and Privacy Policy.
					</PoText>
				</View>
			}
		>
			<SetupTop onBack={() => router.back()} />
			<View style={styles.spacer} />
			<Animated.View entering={FadeInDown.duration(480)} style={styles.brand}>
				<LogoMark size={72} />
				<View style={styles.text}>
					<PoText variant="eyebrow11" tone="textTertiary">
						Almost done
					</PoText>
					<PoText variant="title30" style={styles.center}>
						Save your plan
					</PoText>
					<PoText variant="body15" tone="textSecondary" style={styles.center}>
						Create an account so your OS syncs between web and phone.
					</PoText>
				</View>
			</Animated.View>
			<View style={styles.spacer} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1 },
	brand: { alignItems: "center", gap: 22 },
	text: { alignItems: "center", gap: 10, paddingHorizontal: 4 },
	center: { textAlign: "center" },
	footer: { gap: 8 },
});
