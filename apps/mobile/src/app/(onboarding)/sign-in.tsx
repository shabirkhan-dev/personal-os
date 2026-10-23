import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { LogoMark } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { EmailSignIn } from "@/modules/auth/components/email-sign-in";
import { useAuth } from "@/modules/auth/context/auth-context";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { type SavedPlan, useSavedPlan } from "@/modules/onboarding/hooks/use-saved-plan";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { goBack } from "@/modules/onboarding/lib/navigation";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { rise, usePoTheme } from "@/theme";

const continueToAllSet = () => router.push(onboardingRoutes.allSet);

/**
 * 17 Sign in. Email codes create or open the account. Apple and Google sign-in need provider
 * setup (card pos-12), so they are not offered yet; "Not now" keeps the plan on this phone.
 * An account that already has a plan is asked which one to keep, so it is never overwritten
 * silently.
 */
export default function SignInScreen() {
	const { status, user } = useAuth();
	const name = useOnboardingStore((state) => state.name);
	const [usingEmail, setUsingEmail] = useState(false);
	const signedIn = status === "signed-in" && user !== null;
	const saved = useSavedPlan();

	if (usingEmail) {
		return (
			<OnboardingScreen glow="accentDefault" scroll>
				<SetupTop onBack={() => setUsingEmail(false)} />
				<View style={styles.gap} />
				<EmailSignIn
					name={name}
					onSignedIn={() => setUsingEmail(false)}
					onCancel={() => setUsingEmail(false)}
				/>
			</OnboardingScreen>
		);
	}

	return (
		<OnboardingScreen
			glow="accentDefault"
			footer={
				<View style={styles.footer}>
					{signedIn ? (
						<SignedInActions saved={saved} />
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
			<SetupTop onBack={() => goBack(onboardingRoutes.signIn)} />
			<View style={styles.spacer} />
			<Animated.View entering={rise()} style={styles.brand}>
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
							? signedInLine(user.email, saved)
							: "Create an account so your plan is backed up and follows you to a new phone."}
					</PoText>
				</View>
			</Animated.View>
			<View style={styles.spacer} />
		</OnboardingScreen>
	);
}

function signedInLine(email: string, saved: SavedPlan): string {
	if (saved.kind === "found") {
		return `${email} already has a plan from another phone. Keep that one, or replace it with the plan you just made.`;
	}
	if (saved.kind === "error") {
		return `Signed in as ${email}, but we couldn't check for a plan saved on this account.`;
	}
	return `Signed in as ${email}.`;
}

/** Continue, or the choice between the account's saved plan and the one just made. */
function SignedInActions({ saved }: { saved: SavedPlan }) {
	const { colors } = usePoTheme();
	const restoreSaved = useOnboardingProgress((state) => state.restoreSaved);
	const [restoring, setRestoring] = useState(false);

	if (saved.kind === "checking" || saved.kind === "signed-out") {
		return <ActivityIndicator color={colors.textSecondary} accessibilityLabel="Loading" />;
	}
	if (saved.kind === "found") {
		const takeSaved = async () => {
			setRestoring(true);
			await restoreSaved(saved.plan.answers, saved.plan.updatedAt);
			router.replace("/");
		};
		return (
			<>
				<PillButton
					label={restoring ? "Restoring…" : "Use my saved plan"}
					disabled={restoring}
					onPress={() => {
						takeSaved().catch((error: unknown) => {
							setRestoring(false);
							console.error("[onboarding] could not restore the saved plan", error);
						});
					}}
				/>
				<PillButton
					variant="ghost"
					label="Replace it with this plan"
					disabled={restoring}
					onPress={continueToAllSet}
				/>
			</>
		);
	}
	if (saved.kind === "error") {
		return (
			<>
				<PillButton label="Try again" onPress={saved.retry} />
				<PillButton variant="ghost" label="Continue anyway" onPress={continueToAllSet} />
			</>
		);
	}
	return <PillButton label="Continue" onPress={continueToAllSet} />;
}

const styles = StyleSheet.create({
	spacer: { flex: 1 },
	gap: { height: 32 },
	brand: { alignItems: "center", gap: 22 },
	text: { alignItems: "center", gap: 10, paddingHorizontal: 4 },
	center: { textAlign: "center" },
	footer: { gap: 8 },
});
