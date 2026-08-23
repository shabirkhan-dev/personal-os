import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { devCodeRouteParams } from "@/modules/auth/lib/dev-auth-code";
import { authService } from "@/modules/auth/services/auth.service";
import { useTheme } from "@/providers/theme-provider";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import { AuthField } from "./auth-field";
import { AuthScreen } from "./auth-screen";

export function ForgotPasswordForm() {
	const { colors } = useTheme();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit() {
		setError(null);
		setSubmitting(true);
		try {
			const result = await authService.forgotPassword(email.trim().toLowerCase());
			const normalizedEmail = email.trim().toLowerCase();
			router.push({
				pathname: "/(auth)/reset-password",
				params: { email: normalizedEmail, ...devCodeRouteParams(result.developmentCode) },
			});
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Request failed");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthScreen
			title="Forgot your password?"
			description="We will send a reset code if an account exists."
		>
			{error ? <AuthAlert variant="destructive" title="Request failed" message={error} /> : null}
			<AuthField
				label="Email"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoComplete="email"
			/>
			<AuthButton label="Send reset code" onPress={handleSubmit} pending={submitting} />
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
