import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useAuth } from "@/modules/auth/context/auth-context";
import { devCodeRouteParams } from "@/modules/auth/lib/dev-auth-code";
import { registerSchema } from "@/modules/auth/schemas/auth.schemas";
import { useTheme } from "@/providers/theme-provider";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import { AuthField } from "./auth-field";
import { AuthScreen } from "./auth-screen";

export function SignupForm() {
	const { user, loading, error, clearError, register } = useAuth();
	const { colors } = useTheme();
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

	if (loading || user) {
		return <AuthScreen busy title="" description="" />;
	}

	async function handleSubmit() {
		clearError();
		setLocalError(null);

		if (password !== confirmPassword) {
			setLocalError("Passwords do not match.");
			return;
		}

		const parsed = registerSchema.safeParse({ email, username, password });
		if (!parsed.success) {
			setLocalError(parsed.error.issues[0]?.message ?? "Invalid registration details");
			return;
		}

		setSubmitting(true);
		try {
			const result = await register(parsed.data);
			router.push({
				pathname: "/(auth)/verify-email",
				params: { email: parsed.data.email, ...devCodeRouteParams(result.developmentCode) },
			});
		} catch {
			// error set in context
		} finally {
			setSubmitting(false);
		}
	}

	const displayError = localError ?? error;

	return (
		<AuthScreen
			title="Create your account"
			description="Create your secure Personal OS account"
			footer={
				<Text style={[styles.terms, { color: colors.text.muted }]}>
					By continuing, you agree to our Terms of Service and Privacy Policy.
				</Text>
			}
		>
			{displayError ? (
				<AuthAlert variant="destructive" title="Could not create account" message={displayError} />
			) : null}

			<AuthField
				label="Email"
				value={email}
				onChangeText={setEmail}
				placeholder="you@example.com"
				keyboardType="email-address"
				autoComplete="email"
				editable={!submitting}
				hint="We'll use this for sign-in and account recovery."
			/>
			<AuthField
				label="Username"
				value={username}
				onChangeText={setUsername}
				placeholder="johndoe"
				autoComplete="username"
				editable={!submitting}
			/>
			<AuthField
				label="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry={!showPassword}
				showPasswordToggle
				onTogglePassword={() => setShowPassword((prev) => !prev)}
				autoComplete="new-password"
				editable={!submitting}
				hint="Must be at least 12 characters."
			/>
			<AuthField
				label="Confirm password"
				value={confirmPassword}
				onChangeText={setConfirmPassword}
				secureTextEntry={!showPassword}
				autoComplete="new-password"
				editable={!submitting}
				errorHint={passwordsMismatch ? "Passwords do not match." : undefined}
			/>
			<AuthButton
				label={submitting ? "Creating account…" : "Create account"}
				onPress={handleSubmit}
				pending={submitting}
				disabled={passwordsMismatch}
			/>
			<Text style={[styles.footerText, { color: colors.text.secondary }]}>
				Already have an account?{" "}
				<Link href="/(auth)/login" style={[styles.link, { color: colors.accent.green }]}>
					Sign in
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
	terms: {
		fontSize: 12,
		textAlign: "center",
		paddingHorizontal: 12,
	},
});
