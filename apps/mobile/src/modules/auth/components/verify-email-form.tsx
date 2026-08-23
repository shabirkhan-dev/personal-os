import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { devCodeRouteParams, readDevCodeParam } from "@/modules/auth/lib/dev-auth-code";
import { authService } from "@/modules/auth/services/auth.service";
import { useTheme } from "@/providers/theme-provider";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import { AuthField } from "./auth-field";
import { AuthScreen } from "./auth-screen";

export function VerifyEmailForm() {
	const { colors } = useTheme();
	const params = useLocalSearchParams<{ email?: string; devCode?: string }>();
	const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
	const [code, setCode] = useState("");
	const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [resending, setResending] = useState(false);

	useEffect(() => {
		setDevelopmentCode(readDevCodeParam(params.devCode));
	}, [params.devCode]);

	async function handleSubmit() {
		setError(null);
		setSubmitting(true);
		try {
			await authService.verifyEmail({ email, code });
			router.replace({ pathname: "/(auth)/login", params: { verified: "true" } });
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Verification failed");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleResend() {
		setError(null);
		setResending(true);
		try {
			const result = await authService.resendVerification(email);
			if (result.developmentCode) {
				setDevelopmentCode(result.developmentCode);
				router.replace({
					pathname: "/(auth)/verify-email",
					params: { email, ...devCodeRouteParams(result.developmentCode) },
				});
			}
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not resend code");
		} finally {
			setResending(false);
		}
	}

	return (
		<AuthScreen
			title="Verify your email"
			description="Enter the six-digit code sent to your email address."
		>
			{developmentCode ? <AuthAlert title="Development code" message={developmentCode} /> : null}
			{error ? (
				<AuthAlert variant="destructive" title="Could not verify email" message={error} />
			) : null}
			<AuthField
				label="Email"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoComplete="email"
			/>
			<AuthField
				label="Verification code"
				value={code}
				onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
				keyboardType="number-pad"
				autoComplete="one-time-code"
				maxLength={6}
			/>
			<AuthButton label="Verify email" onPress={handleSubmit} pending={submitting} />
			<AuthButton
				label={resending ? "Sending..." : "Send a new code"}
				variant="outline"
				onPress={handleResend}
				pending={resending}
				disabled={!email}
			/>
			<Text style={[styles.footerText, { color: colors.text.secondary }]}>
				<Link href="/(auth)/login" style={[styles.link, { color: colors.accent.green }]}>
					Back to sign in
				</Link>
			</Text>
		</AuthScreen>
	);
}

const styles = StyleSheet.create({
	footerText: {
		textAlign: "center",
		fontSize: 14,
	},
	link: {
		textDecorationLine: "underline",
		fontWeight: "600",
	},
});
