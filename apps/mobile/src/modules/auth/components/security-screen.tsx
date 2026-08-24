import {
	CheckmarkCircle02Icon,
	ComputerIcon,
	FingerAccessIcon,
	Shield01Icon,
	ShieldOffIcon,
	SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";
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

export function SecurityScreen() {
	const { user, logoutAll } = useAuth();
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

	const handleDeletePasskey = (passkeyId: string) => {
		Alert.alert("Remove passkey", "Delete this passkey from your account?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () => deletePasskey.mutate(passkeyId),
			},
		]);
	};

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
					keyboardShouldPersistTaps="handled"
				>
					<View className="px-4 pt-2">
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
								ACCOUNT
							</Text>
							<Text className="text-foreground text-3xl font-light tracking-tight">Security</Text>
							<Text className="text-muted-foreground text-sm mt-1">
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

						{/* Overview Chips */}
						<View className="flex-row flex-wrap gap-2 mb-2">
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

						<Text className="text-muted-foreground text-xs font-medium mb-5">
							{protectionCount} of 4 protections active
							{googleLinked ? " · Google linked" : ""}
						</Text>

						{/* Two-Factor Authentication Section */}
						<View className="mb-5">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
								TWO-FACTOR AUTHENTICATION
							</Text>
							<Card className="p-5">
								<CardHeader className="mb-3">
									<CardDescription>
										Require an authenticator code after password sign-in.
									</CardDescription>
								</CardHeader>
								<CardContent className="gap-3">
									{security.isLoading ? (
										<ActivityIndicator className="text-primary" />
									) : totpEnabled ? (
										<>
											<View className="flex-row items-center gap-2 py-1">
												<Icon
													icon={CheckmarkCircle02Icon}
													size={16}
													className="text-primary"
													strokeWidth={2}
												/>
												<Text className="text-foreground text-xs font-medium">
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
											<Image
												source={{ uri: beginTotp.data.qrCodeDataUrl }}
												className="w-44 h-44 self-center rounded-xl my-2"
											/>
											<Text className="text-muted-foreground text-xs text-center">
												Scan the QR code, then enter the six-digit code from your authenticator.
											</Text>
											<Text
												className="font-mono text-xs text-foreground bg-muted/60 p-2.5 rounded-xl text-center my-1"
												selectable
											>
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
												label={confirmTotp.isPending ? "Verifying…" : "Enable 2FA"}
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
											label={beginTotp.isPending ? "Setting up…" : "Set up authenticator app"}
											variant="outline"
											pending={beginTotp.isPending}
											onPress={() => beginTotp.mutate()}
										/>
									)}

									{recoveryCodes.length > 0 ? (
										<View className="bg-muted/50 border border-border p-3.5 rounded-2xl gap-2 mt-2">
											<Text className="text-foreground text-xs font-bold">
												Save these recovery codes
											</Text>
											<Text className="text-muted-foreground text-[11px]">
												Store them securely. Each code can be used once if you lose your
												authenticator.
											</Text>
											<View className="flex-row flex-wrap gap-2 pt-1">
												{recoveryCodes.map((c) => (
													<Text
														key={c}
														className="font-mono text-xs text-foreground bg-card border border-border/60 px-2 py-1 rounded-lg"
														selectable
													>
														{c}
													</Text>
												))}
											</View>
										</View>
									) : null}
								</CardContent>
							</Card>
						</View>

						{/* Passkeys Section */}
						<View className="mb-5">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
								PASSKEYS & BIOMETRICS
							</Text>
							<Card className="p-5">
								<CardHeader className="mb-3">
									<CardDescription>
										Sign in using Face ID, fingerprint, or your device screen lock.
									</CardDescription>
								</CardHeader>
								<CardContent className="gap-3">
									{passkeys.map((pk) => (
										<View
											key={pk.id}
											className="flex-row items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border"
										>
											<View className="flex-row items-center gap-3 flex-1 pr-2">
												<Icon icon={FingerAccessIcon} size={20} className="text-primary" />
												<View className="flex-1">
													<Text className="text-foreground text-xs font-semibold" numberOfLines={1}>
														{pk.name}
													</Text>
													<Text className="text-muted-foreground text-[10px]">
														Added {new Date(pk.createdAt).toLocaleDateString()}
													</Text>
												</View>
											</View>
											<Pressable
												onPress={() => handleDeletePasskey(pk.id)}
												className="px-2 py-1 rounded-lg bg-destructive/10"
											>
												<Text className="text-destructive text-xs font-bold">Remove</Text>
											</Pressable>
										</View>
									))}

									<AuthField
										label="Device / passkey name"
										value={passkeyName}
										onChangeText={setPasskeyName}
										placeholder="e.g. Work Phone"
										maxLength={64}
									/>
									<AuthButton
										label={registerPasskey.isPending ? "Registering…" : "Register new passkey"}
										variant="outline"
										pending={registerPasskey.isPending}
										disabled={!passkeyName.trim()}
										onPress={() => registerPasskey.mutate(passkeyName.trim())}
									/>
								</CardContent>
							</Card>
						</View>

						{/* Password Management */}
						<View className="mb-5">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
								PASSWORD
							</Text>
							<Card className="p-5">
								<CardContent className="gap-3">
									{passwordSaved ? (
										<AuthAlert
											title="Password updated"
											message="Your new password is now active."
										/>
									) : null}

									{user.hasPassword ? (
										<AuthField
											label="Current password"
											value={currentPassword}
											onChangeText={setCurrentPassword}
											secureTextEntry={!showCurrent}
											showPasswordToggle
											onTogglePassword={() => setShowCurrent((v) => !v)}
										/>
									) : null}

									<AuthField
										label="New password"
										value={newPassword}
										onChangeText={setNewPassword}
										secureTextEntry={!showNew}
										showPasswordToggle
										onTogglePassword={() => setShowNew((v) => !v)}
										hint="Must be at least 12 characters."
									/>

									<AuthButton
										label={changePassword.isPending ? "Updating…" : "Update password"}
										pending={changePassword.isPending}
										disabled={newPassword.length < 12}
										onPress={() => {
											changePassword.mutate(
												{
													currentPassword,
													newPassword,
												},
												{
													onSuccess: () => {
														setPasswordSaved(true);
														setCurrentPassword("");
														setNewPassword("");
													},
												},
											);
										}}
									/>
								</CardContent>
							</Card>
						</View>

						{/* Active Sessions */}
						<View className="mb-5">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
								ACTIVE SESSIONS
							</Text>
							<Card className="p-5">
								<CardHeader className="mb-3">
									<CardDescription>
										Devices and browsers currently signed in to your account.
									</CardDescription>
								</CardHeader>
								<CardContent className="gap-2.5">
									{sessions.isLoading ? (
										<ActivityIndicator className="text-primary" />
									) : (
										(sessions.data ?? []).map((s) => (
											<View
												key={s.id}
												className="flex-row items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border"
											>
												<View className="flex-row items-center gap-3 flex-1 pr-2">
													<Icon
														icon={s.userAgent?.includes("Mobile") ? SmartPhone01Icon : ComputerIcon}
														size={18}
														className="text-muted-foreground"
													/>
													<View className="flex-1">
														<View className="flex-row items-center gap-1.5">
															<Text
																className="text-foreground text-xs font-semibold"
																numberOfLines={1}
															>
																{s.userAgent ?? "Unknown device"}
															</Text>
															{s.isCurrent ? <Badge variant="success">This device</Badge> : null}
														</View>
														<Text className="text-muted-foreground text-[10px]">
															Expires {new Date(s.expiresAt).toLocaleDateString()}
														</Text>
													</View>
												</View>
												{!s.isCurrent ? (
													<Pressable
														onPress={() => revoke.mutate(s.id)}
														className="px-2 py-1 rounded-lg bg-destructive/10"
													>
														<Text className="text-destructive text-xs font-bold">Revoke</Text>
													</Pressable>
												) : null}
											</View>
										))
									)}

									<View className="pt-2">
										<Button variant="destructive" onPress={confirmLogoutAll}>
											Sign out everywhere
										</Button>
									</View>
								</CardContent>
							</Card>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

function OverviewChip({ label, value, active }: { label: string; value: string; active: boolean }) {
	return (
		<View
			className={cn(
				"flex-1 min-w-[45%] p-3 rounded-2xl border",
				active ? "bg-primary/10 border-primary/30" : "bg-muted/40 border-border",
			)}
		>
			<View className="flex-row items-center gap-1.5 mb-1">
				<Icon
					icon={active ? Shield01Icon : ShieldOffIcon}
					size={14}
					className={active ? "text-primary" : "text-muted-foreground"}
				/>
				<Text className="text-muted-foreground text-xs font-semibold">{label}</Text>
			</View>
			<Text className="text-foreground text-xs font-bold" numberOfLines={1}>
				{value}
			</Text>
		</View>
	);
}
