import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LogoMark } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { EmailSignIn } from "@/modules/auth/components/email-sign-in";
import { useAuth } from "@/modules/auth/context/auth-context";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";

const continueToAllSet = () => router.push(onboardingRoutes.allSet);

/**
 * 17 Sign in. Email codes create or open the account. Apple and Google sign-in need provider
 * setup (card pos-12), so they are not offered yet; "Not now" keeps the plan on this phone.
 */
export default function SignInScreen() {
	const { status, user } = useAuth();
	const name = useOnboardingStore((state) => state.name);
	const [usingEmail, setUsingEmail] = useState(false);
	const signedIn = status === "signed-in" && user !== null;

	if (usingEmail) {
		return (
			<KeyboardAvoidingView
				style={styles.fill}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<OnboardingScreen glow="accentDefault" scroll>
					<SetupTop onBack={() => setUsingEmail(false)} />
					<View style={styles.gap} />
					<EmailSignIn
						name={name}
						onSignedIn={continueToAllSet}
						onCancel={() => setUsingEmail(false)}
					/>
				</OnboardingScreen>
			</KeyboardAvoidingView>
		);
	}

	return (
		<OnboardingScreen
			glow="accentDefault"
			footer={
				<View style={styles.footer}>
					{signedIn ? (
						<PillButton label="Continue" onPress={continueToAllSet} />
					) : (
						<>
							<PillButton label="Continue with email" onPress={() => setUsingEmail(true)} />
							<PillButton variant="ghost" label="Not now" onPress={continueToAllSet} />
						</>
					)}
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
						{signedIn
							? `Signed in as ${user.email}.`
							: "Create an account so your plan is backed up and follows you to a new phone."}
					</PoText>
				</View>
			</Animated.View>
			<View style={styles.spacer} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1 },
	spacer: { flex: 1 },
	gap: { height: 32 },
	brand: { alignItems: "center", gap: 22 },
	text: { alignItems: "center", gap: 10, paddingHorizontal: 4 },
	center: { textAlign: "center" },
	footer: { gap: 8 },
});
