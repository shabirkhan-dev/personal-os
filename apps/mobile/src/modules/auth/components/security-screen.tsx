import {
	CheckmarkCircle02Icon,
	ComputerIcon,
	FingerAccessIcon,
	Key01Icon,
	LockIcon,
	Shield01Icon,
	ShieldOffIcon,
	SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { useAuth } from "@/modules/auth";
import { AccountTabs } from "@/modules/auth/components/account-tabs";
import { AuthAlert } from "@/modules/auth/components/auth-alert";
import { AuthButton } from "@/modules/auth/components/auth-button";
import { AuthField } from "@/modules/auth/components/auth-field";
import {
	useBeginTotpSetupMutation,
	useChangePasswordMutation,
	useConfirmTotpSetupMutation,
	useDeletePasskeyMutation,
	useDisableTotpMutation,
	useRegisterPasskeyMutation,
	useRevokeSessionMutation,
} from "@/modules/auth/hooks/use-auth-mutations";
import { useSecurityStatusQuery, useSessionsQuery } from "@/modules/auth/hooks/use-auth-queries";
import { useTheme } from "@/providers/theme-provider";

export function SecurityScreen() {
	const { user, logout, logoutAll } = useAuth();
	const { colors } = useTheme();
	const sessions = useSessionsQuery();
	const security = useSecurityStatusQuery();
	const changePassword = useChangePasswordMutation();
	const revoke = useRevokeSessionMutation();
	const beginTotp = useBeginTotpSetupMutation();
	const confirmTotp = useConfirmTotpSetupMutation();
	const disableTotp = useDisableTotpMutation();
	const registerPasskey = useRegisterPasskeyMutation();
	const deletePasskey = useDeletePasskeyMutation();

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [totpCode, setTotpCode] = useState("");
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
	const [passkeyName, setPasskeyName] = useState("This device");
	const [passwordSaved, setPasswordSaved] = useState(false);

	if (!user) return null;

	const error = [
		sessions.error,
		security.error,
		changePassword.error,
		revoke.error,
		beginTotp.error,
		confirmTotp.error,
		disableTotp.error,
		registerPasskey.error,
		deletePasskey.error,
	].find((value) => value instanceof Error);

	const passkeys = security.data?.passkeys ?? [];
	const totpEnabled = security.data?.mfa.totpEnabled ?? false;
	const googleLinked = security.data?.social.googleLinked ?? false;
	const protectionCount = [
		user.emailVerified,
		user.hasPassword,
		totpEnabled,
		passkeys.length > 0,
	].filter(Boolean).length;

	const confirmLogoutAll = () => {
		Alert.alert("Sign out everywhere", "Revoke all active sessions for this account?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign out everywhere",
				style: "destructive",
				onPress: () => {
					void logoutAll();
				},
			},
		]);
	};

	const confirmRevoke = (sessionId: string, isCurrent: boolean) => {
		Alert.alert(
			isCurrent ? "Revoke this device?" : "Revoke session?",
			isCurrent
				? "You will be signed out on this device."
				: "That device will need to sign in again.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Revoke",
					style: "destructive",
					onPress: () => {
						revoke.mutate(sessionId, {
							onSuccess: async () => {
								if (isCurrent) await logout();
							},
						});
					},
				},
			],
		);
	};

	const confirmDeletePasskey = (passkeyId: string, name: string) => {
		Alert.alert("Remove passkey", `Remove “${name}”?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () => deletePasskey.mutate(passkeyId),
			},
		]);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={[styles.eyebrow, { color: colors.text.secondary }]}>ACCOUNT</Text>
							<Text style={[styles.viewTitle, { color: colors.text.primary }]}>Security</Text>
							<Text style={[styles.viewSubtitle, { color: colors.text.secondary }]}>
								Manage sign-in methods, recovery options, and devices with access.
							</Text>
						</View>

						<AccountTabs active="security" />

						{error ? (
							<AuthAlert
								variant="destructive"
								title="Something went wrong"
								message={error.message}
							/>
						) : null}

						<View style={styles.overviewGrid}>
							<OverviewChip
								label="Email"
								value={user.emailVerified ? "Verified" : "Needs verification"}
								active={user.emailVerified}
							/>
							<OverviewChip
								label="Password"
								value={user.hasPassword ? "Configured" : "Not configured"}
								active={user.hasPassword}
							/>
							<OverviewChip
								label="Two-factor"
								value={totpEnabled ? "Enabled" : "Not enabled"}
								active={totpEnabled}
							/>
							<OverviewChip
								label="Passkeys"
								value={passkeys.length === 1 ? "1 registered" : `${passkeys.length} registered`}
								active={passkeys.length > 0}
							/>
						</View>

						<Text style={styles.protectionHint}>
							{protectionCount} of 4 protections active
							{googleLinked ? " · Google linked" : ""}
						</Text>

						<View style={styles.section}>
							<Text style={styles.sectionLabel}>TWO-FACTOR AUTHENTICATION</Text>
							<NeonCard>
								<View style={styles.sectionBody}>
									<Text style={styles.sectionHelp}>
										Require an authenticator code after password sign-in.
									</Text>
									{security.isLoading ? (
										<ActivityIndicator color={NeonColors.accent.green} />
									) : totpEnabled ? (
										<>
											<View style={styles.statusRow}>
												<Icon
													icon={CheckmarkCircle02Icon}
													size={16}
													color={NeonColors.accent.green}
													strokeWidth={2}
												/>
												<Text style={styles.statusText}>
													Authenticator active · {security.data?.mfa.recoveryCodesRemaining ?? 0}{" "}
													recovery codes left
												</Text>
											</View>
											<AuthField
												label="Authenticator or recovery code"
												value={totpCode}
												onChangeText={setTotpCode}
												placeholder="123456"
												keyboardType="number-pad"
												autoComplete="one-time-code"
												maxLength={32}
											/>
											<AuthButton
												label={disableTotp.isPending ? "Disabling…" : "Disable 2FA"}
												variant="outline"
												pending={disableTotp.isPending}
												disabled={!totpCode.trim()}
												onPress={() => {
													disableTotp.mutate(totpCode, {
														onSuccess: () => setTotpCode(""),
													});
												}}
											/>
										</>
									) : beginTotp.data ? (
										<>
											<Image source={{ uri: beginTotp.data.qrCodeDataUrl }} style={styles.qr} />
											<Text style={styles.sectionHelp}>
												Scan the QR code, then enter the six-digit code from your authenticator.
											</Text>
											<Text style={styles.secret} selectable>
												{beginTotp.data.secret}
											</Text>
											<AuthField
												label="Six-digit code"
												value={totpCode}
												onChangeText={setTotpCode}
												placeholder="123456"
												keyboardType="number-pad"
												autoComplete="one-time-code"
												maxLength={6}
											/>
											<AuthButton
												label={confirmTotp.isPending ? "Confirming…" : "Confirm 2FA"}
												pending={confirmTotp.isPending}
												disabled={totpCode.trim().length !== 6}
												onPress={() => {
													confirmTotp.mutate(totpCode, {
														onSuccess: (result) => {
															setRecoveryCodes(result.recoveryCodes);
															setTotpCode("");
														},
													});
												}}
											/>
										</>
									) : (
										<AuthButton
											label={beginTotp.isPending ? "Starting…" : "Set up authenticator"}
											pending={beginTotp.isPending}
											onPress={() => beginTotp.mutate()}
										/>
									)}
									{recoveryCodes.length > 0 ? (
										<View style={styles.recoveryBox}>
											<Text style={styles.recoveryTitle}>Save these recovery codes now</Text>
											{recoveryCodes.map((code) => (
												<Text key={code} style={styles.recoveryCode} selectable>
													{code}
												</Text>
											))}
										</View>
									) : null}
								</View>
							</NeonCard>
						</View>

						<View style={styles.section}>
							<Text style={styles.sectionLabel}>PASSKEYS</Text>
							<NeonCard>
								<View style={styles.sectionBody}>
									<Text style={styles.sectionHelp}>
										Use biometrics, a device PIN, or a physical security key. Requires a development
										build (not Expo Go).
									</Text>
									{passkeys.length === 0 ? (
										<Text style={styles.empty}>No passkeys registered</Text>
									) : (
										passkeys.map((passkey) => (
											<View key={passkey.id} style={styles.listRow}>
												<View style={styles.listIcon}>
													<Icon
														icon={Key01Icon}
														size={16}
														color={NeonColors.text.secondary}
														strokeWidth={1.8}
													/>
												</View>
												<View style={styles.listCopy}>
													<Text style={styles.listTitle}>{passkey.name}</Text>
													<Text style={styles.listMeta}>
														{passkey.deviceType}
														{passkey.backedUp ? " · synced" : ""}
													</Text>
												</View>
												<Pressable
													onPress={() => confirmDeletePasskey(passkey.id, passkey.name)}
													hitSlop={8}
												>
													<Text style={styles.dangerLink}>Remove</Text>
												</Pressable>
											</View>
										))
									)}
									<AuthField
										label="Device name"
										value={passkeyName}
										onChangeText={setPasskeyName}
										placeholder="This device"
										maxLength={64}
									/>
									<AuthButton
										label={registerPasskey.isPending ? "Adding…" : "Add passkey"}
										pending={registerPasskey.isPending}
										disabled={!passkeyName.trim()}
										onPress={() => registerPasskey.mutate(passkeyName.trim())}
									/>
								</View>
							</NeonCard>
						</View>

						{user.hasPassword ? (
							<View style={styles.section}>
								<Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>
								<NeonCard>
									<View style={styles.sectionBody}>
										<Text style={styles.sectionHelp}>
											Changing it signs out every other active session.
										</Text>
										{passwordSaved && changePassword.isSuccess ? (
											<AuthAlert
												title="Password updated"
												message="Use your new password next time."
											/>
										) : null}
										<AuthField
											label="Current password"
											value={currentPassword}
											onChangeText={setCurrentPassword}
											secureTextEntry={!showCurrent}
											showPasswordToggle
											onTogglePassword={() => setShowCurrent((v) => !v)}
											autoComplete="password"
										/>
										<AuthField
											label="New password"
											value={newPassword}
											onChangeText={setNewPassword}
											secureTextEntry={!showNew}
											showPasswordToggle
											onTogglePassword={() => setShowNew((v) => !v)}
											autoComplete="new-password"
											hint="Use at least 12 characters."
										/>
										<AuthButton
											label={changePassword.isPending ? "Updating…" : "Change password"}
											pending={changePassword.isPending}
											disabled={currentPassword.length === 0 || newPassword.length < 12}
											onPress={() => {
												setPasswordSaved(true);
												changePassword.mutate(
													{ currentPassword, newPassword },
													{
														onSuccess: () => {
															setCurrentPassword("");
															setNewPassword("");
														},
													},
												);
											}}
										/>
									</View>
								</NeonCard>
							</View>
						) : null}

						<View style={styles.section}>
							<Text style={styles.sectionLabel}>ACTIVE SESSIONS</Text>
							<NeonCard>
								<View style={styles.sectionBody}>
									{sessions.isLoading ? (
										<ActivityIndicator color={NeonColors.accent.green} />
									) : sessions.data?.length ? (
										sessions.data.map((session) => (
											<View key={session.id} style={styles.listRow}>
												<View style={styles.listIcon}>
													<Icon
														icon={ComputerIcon}
														size={16}
														color={NeonColors.text.secondary}
														strokeWidth={1.8}
													/>
												</View>
												<View style={styles.listCopy}>
													<Text style={styles.listTitle} numberOfLines={2}>
														{session.userAgent ?? "Unknown device"}
													</Text>
													<Text style={styles.listMeta}>
														{session.ipAddress ?? "Unknown IP"} ·{" "}
														{new Date(session.lastUsedAt).toLocaleString()}
														{session.isCurrent ? " · Current" : ""}
													</Text>
												</View>
												<Pressable
													onPress={() => confirmRevoke(session.id, session.isCurrent)}
													hitSlop={8}
												>
													<Text style={styles.dangerLink}>Revoke</Text>
												</Pressable>
											</View>
										))
									) : (
										<Text style={styles.empty}>No active sessions found.</Text>
									)}
									<Pressable style={styles.logoutAll} onPress={confirmLogoutAll}>
										<Icon
											icon={ShieldOffIcon}
											size={16}
											color={NeonColors.accent.red}
											strokeWidth={1.8}
										/>
										<Text style={styles.logoutAllText}>Sign out everywhere</Text>
									</Pressable>
								</View>
							</NeonCard>
						</View>

						<View style={styles.footerHint}>
							<Icon
								icon={SmartPhone01Icon}
								size={14}
								color={NeonColors.text.muted}
								strokeWidth={1.8}
							/>
							<Text style={styles.footerHintText}>
								Google account linking is available on the web account settings for now.
							</Text>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

function OverviewChip({ label, value, active }: { label: string; value: string; active: boolean }) {
	return (
		<View style={styles.chip}>
			<View style={styles.chipIcon}>
				{label === "Two-factor" ? (
					<Icon icon={Shield01Icon} size={14} color={NeonColors.text.secondary} strokeWidth={1.8} />
				) : label === "Passkeys" ? (
					<Icon
						icon={FingerAccessIcon}
						size={14}
						color={NeonColors.text.secondary}
						strokeWidth={1.8}
					/>
				) : (
					<Icon icon={LockIcon} size={14} color={NeonColors.text.secondary} strokeWidth={1.8} />
				)}
			</View>
			<Text style={styles.chipLabel}>{label}</Text>
			<View style={styles.chipValueRow}>
				<View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
				<Text style={styles.chipValue} numberOfLines={1}>
					{value}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: NeonColors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 48,
	},
	viewContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
		gap: 24,
	},
	viewHeader: {
		gap: 4,
	},
	eyebrow: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
	},
	viewTitle: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		marginTop: 4,
		lineHeight: 20,
	},
	overviewGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	chip: {
		width: "48%",
		flexGrow: 1,
		gap: 6,
		padding: 12,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
		backgroundColor: "rgba(255,255,255,0.03)",
	},
	chipIcon: {
		width: 28,
		height: 28,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.04)",
	},
	chipLabel: {
		color: NeonColors.text.muted,
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	chipValueRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	dotActive: {
		backgroundColor: NeonColors.accent.green,
	},
	dotInactive: {
		backgroundColor: NeonColors.text.muted,
	},
	chipValue: {
		flex: 1,
		color: NeonColors.text.primary,
		fontSize: 13,
		fontWeight: "600",
	},
	protectionHint: {
		color: NeonColors.text.muted,
		fontSize: 12,
		marginTop: -12,
		paddingHorizontal: 4,
	},
	section: {
		gap: 12,
	},
	sectionLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		paddingHorizontal: 4,
	},
	sectionBody: {
		gap: 14,
	},
	sectionHelp: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		lineHeight: 18,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	statusText: {
		flex: 1,
		color: NeonColors.text.primary,
		fontSize: 13,
		fontWeight: "500",
	},
	qr: {
		width: 160,
		height: 160,
		alignSelf: "center",
		borderRadius: 12,
		backgroundColor: "#fff",
	},
	secret: {
		color: NeonColors.text.secondary,
		fontSize: 11,
		fontFamily: "monospace",
	},
	recoveryBox: {
		gap: 6,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(0, 230, 118, 0.35)",
		backgroundColor: "rgba(0, 230, 118, 0.08)",
	},
	recoveryTitle: {
		color: NeonColors.accent.green,
		fontSize: 13,
		fontWeight: "700",
		marginBottom: 4,
	},
	recoveryCode: {
		color: NeonColors.text.primary,
		fontSize: 12,
		fontFamily: "monospace",
	},
	empty: {
		color: NeonColors.text.muted,
		fontSize: 13,
		textAlign: "center",
		paddingVertical: 8,
	},
	listRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(255,255,255,0.06)",
	},
	listIcon: {
		width: 32,
		height: 32,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.04)",
	},
	listCopy: {
		flex: 1,
		gap: 2,
	},
	listTitle: {
		color: NeonColors.text.primary,
		fontSize: 13,
		fontWeight: "600",
	},
	listMeta: {
		color: NeonColors.text.muted,
		fontSize: 11,
	},
	dangerLink: {
		color: NeonColors.accent.red,
		fontSize: 13,
		fontWeight: "600",
	},
	logoutAll: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		minHeight: 48,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(255, 23, 68, 0.35)",
		backgroundColor: "rgba(255, 23, 68, 0.08)",
		marginTop: 4,
	},
	logoutAllText: {
		color: NeonColors.accent.red,
		fontSize: 15,
		fontWeight: "700",
	},
	footerHint: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		paddingHorizontal: 4,
	},
	footerHintText: {
		flex: 1,
		color: NeonColors.text.muted,
		fontSize: 12,
		lineHeight: 16,
	},
});
