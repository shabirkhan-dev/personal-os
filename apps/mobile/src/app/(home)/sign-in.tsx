import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { EmailSignIn } from "@/modules/auth/components/email-sign-in";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";

/** Sign in from Home (profile menu) for people who skipped it during onboarding. */
export default function HomeSignInScreen() {
	const name = useOnboardingStore((state) => state.name);

	return (
		<OnboardingScreen glow="accentDefault" scroll>
			<SetupTop onBack={() => router.back()} />
			<View style={styles.gap} />
			<EmailSignIn name={name} onSignedIn={() => router.back()} onCancel={() => router.back()} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	gap: { height: 32 },
});
