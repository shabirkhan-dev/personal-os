import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { ApiError } from "@/lib/api/client";
import { toTextStyle, usePoTheme } from "@/theme";
import { useAuth } from "../context/auth-context";

type Step = { kind: "email" } | { kind: "code"; email: string; developmentCode?: string };

export type EmailSignInProps = {
	/** Display name for a new account (from onboarding). */
	name?: string;
	onSignedIn: () => void;
	onCancel: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputStyle = toTextStyle(textStyles.body15);
const codeStyle = toTextStyle(textStyles.title30);

function messageFor(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.code === "AUTH_OTP_INVALID") return "That code is wrong or has expired.";
		if (error.statusCode === 429) return "Too many tries. Wait a minute and try again.";
		if (error.statusCode === 0 || error.statusCode === 408) {
			return "Can't reach Personal OS right now. Check your connection and try again.";
		}
		return error.message;
	}
	return "Something went wrong. Try again.";
}

/** Passwordless email sign-in: email → 6-digit code → session. */
export function EmailSignIn({ name, onSignedIn, onCancel }: EmailSignInProps) {
	const { colors } = usePoTheme();
	const { requestEmailCode, verifyEmailCode } = useAuth();
	const [step, setStep] = useState<Step>({ kind: "email" });
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const field = { backgroundColor: colors.bgSubtle, color: colors.textPrimary };
	const emailValid = EMAIL.test(email.trim());

	const sendCode = async (address: string) => {
		setBusy(true);
		setError(null);
		try {
			const result = await requestEmailCode({ email: address, name: name?.trim() || undefined });
			setCode("");
			setStep({ kind: "code", email: address, developmentCode: result.developmentCode });
		} catch (caught) {
			setError(messageFor(caught));
		} finally {
			setBusy(false);
		}
	};

	const verify = async (address: string) => {
		setBusy(true);
		setError(null);
		try {
			await verifyEmailCode({ email: address, code });
			onSignedIn();
		} catch (caught) {
			setError(messageFor(caught));
			setBusy(false);
		}
	};

	if (step.kind === "email") {
		return (
			<Animated.View entering={FadeInDown.duration(320)} style={styles.block}>
				<PoText variant="title30">Your email</PoText>
				<PoText variant="body15" tone="textSecondary">
					We'll send a 6-digit code. No password needed.
				</PoText>
				<TextInput
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect={false}
					keyboardType="email-address"
					textContentType="emailAddress"
					placeholder="you@example.com"
					placeholderTextColor={colors.textTertiary}
					returnKeyType="send"
					onSubmitEditing={() => (emailValid ? sendCode(email.trim()) : undefined)}
					accessibilityLabel="Email address"
					style={[inputStyle, styles.input, field]}
				/>
				{error ? (
					<PoText variant="meta13" tone="textDanger" accessibilityLiveRegion="polite">
						{error}
					</PoText>
				) : null}
				<View style={styles.actions}>
					<PillButton
						label={busy ? "Sending…" : "Send code"}
						disabled={!emailValid || busy}
						onPress={() => sendCode(email.trim())}
					/>
					<PillButton variant="ghost" label="Back" disabled={busy} onPress={onCancel} />
				</View>
			</Animated.View>
		);
	}

	return (
		<Animated.View entering={FadeInDown.duration(320)} style={styles.block}>
			<PoText variant="title30">Check your email</PoText>
			<PoText variant="body15" tone="textSecondary">
				Enter the code we sent to {step.email}.
			</PoText>
			<TextInput
				value={code}
				onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
				keyboardType="number-pad"
				textContentType="oneTimeCode"
				autoComplete="one-time-code"
				maxLength={6}
				placeholder="000000"
				placeholderTextColor={colors.textTertiary}
				accessibilityLabel="Six-digit code"
				style={[codeStyle, styles.input, styles.code, field]}
			/>
			{step.developmentCode ? (
				<PoText variant="mono13" tone="textTertiary">
					Development code: {step.developmentCode}
				</PoText>
			) : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger" accessibilityLiveRegion="polite">
					{error}
				</PoText>
			) : null}
			<View style={styles.actions}>
				<PillButton
					label={busy ? "Checking…" : "Verify"}
					disabled={code.length !== 6 || busy}
					onPress={() => verify(step.email)}
				/>
				<PillButton
					variant="ghost"
					label="Send a new code"
					disabled={busy}
					onPress={() => sendCode(step.email)}
				/>
				<PillButton
					variant="ghost"
					label="Use a different email"
					disabled={busy}
					onPress={() => {
						setError(null);
						setStep({ kind: "email" });
					}}
				/>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	block: { gap: 12 },
	input: { height: 52, borderRadius: 26, paddingHorizontal: 20 },
	code: { height: 64, borderRadius: 32, letterSpacing: 8, textAlign: "center" },
	actions: { gap: 8, marginTop: 8 },
});
