import { router } from "expo-router";
import { type ReactNode, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { LogoMark } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { EmailSignIn } from "@/modules/auth/components/email-sign-in";
import { useAuth } from "@/modules/auth/context/auth-context";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { useSavedPlan } from "@/modules/onboarding/hooks/use-saved-plan";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { goBack } from "@/modules/onboarding/lib/navigation";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { rise, usePoTheme } from "@/theme";

const back = () => goBack(onboardingRoutes.welcomeBack);
const setUp = () => router.replace(onboardingRoutes.chooseHow);

/**
 * Sign in to an existing account: after a reinstall or on a new phone the saved plan comes back
 * and the app opens, instead of replaying onboarding. Records follow through sync.
 */
export default function WelcomeBackScreen() {
	const { colors } = usePoTheme();
	const { user } = useAuth();
	const saved = useSavedPlan();
	const restoreSaved = useOnboardingProgress((state) => state.restoreSaved);
	const restoring = useRef(false);

	useEffect(() => {
		if (saved.kind !== "found" || restoring.current) return;
		restoring.current = true;
		restoreSaved(saved.plan.answers, saved.plan.updatedAt)
			.then(() => router.replace("/"))
			.catch((error: unknown) => {
				restoring.current = false;
				console.error("[onboarding] could not restore the saved plan", error);
			});
	}, [saved, restoreSaved]);

	if (saved.kind === "signed-out") {
		return (
			<OnboardingScreen glow="accentDefault" scroll>
				<SetupTop onBack={back} />
				<View style={styles.gap} />
				{/* Signing in re-renders this screen through the auth status. */}
				<EmailSignIn onSignedIn={() => undefined} onCancel={back} />
			</OnboardingScreen>
		);
	}

	if (saved.kind === "none") {
		return (
			<Message
				eyebrow={user ? `Signed in as ${user.email}` : "Signed in"}
				title="No plan on this account yet"
				body="Set up your OS once and it's saved to this account, ready for your next phone."
				footer={<PillButton label="Set up my OS" onPress={setUp} />}
			/>
		);
	}

	if (saved.kind === "error") {
		return (
			<Message
				eyebrow="Couldn't reach Personal OS"
				title="Your plan didn't load"
				body="Check your connection and try again. Nothing on this phone has changed."
				footer={
					<>
						<PillButton label="Try again" onPress={saved.retry} />
						<PillButton variant="ghost" label="Set up from scratch" onPress={setUp} />
					</>
				}
			/>
		);
	}

	return (
		<Message
			eyebrow="Welcome back"
			title={saved.kind === "found" ? "Restoring your plan" : "Looking for your plan"}
			body="Your routines, modules and records are coming back to this phone."
			footer={<ActivityIndicator color={colors.textSecondary} accessibilityLabel="Loading" />}
		/>
	);
}

function Message({
	eyebrow,
	title,
	body,
	footer,
}: {
	eyebrow: string;
	title: string;
	body: string;
	footer: ReactNode;
}) {
	return (
		<OnboardingScreen glow="accentDefault" footer={<View style={styles.footer}>{footer}</View>}>
			<SetupTop onBack={back} />
			<View style={styles.spacer} />
			<Animated.View entering={rise()} style={styles.brand}>
				<LogoMark size={72} />
				<View style={styles.text}>
					<PoText variant="eyebrow11" tone="textTertiary" style={styles.center}>
						{eyebrow}
					</PoText>
					<PoText variant="title30" style={styles.center}>
						{title}
					</PoText>
					<PoText variant="body15" tone="textSecondary" style={styles.center}>
						{body}
					</PoText>
				</View>
			</Animated.View>
			<View style={styles.spacer} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1 },
	gap: { height: 32 },
	brand: { alignItems: "center", gap: 22 },
	text: { alignItems: "center", gap: 10, paddingHorizontal: 4 },
	center: { textAlign: "center" },
	footer: { gap: 8, alignItems: "stretch" },
});
