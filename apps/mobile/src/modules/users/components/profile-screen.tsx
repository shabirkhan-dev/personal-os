import {
	Calendar01Icon,
	CheckmarkCircle02Icon,
	Key01Icon,
	Logout01Icon,
	Mail01Icon,
	ShieldOffIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useEffect } from "react";
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
import { BottomNav } from "@/components/ui/bottom-nav";
import { Icon, type IconProp } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { resolveMediaUrl } from "@/lib/media-url";
import { useAuth } from "@/modules/auth";
import { AccountTabs } from "@/modules/auth/components/account-tabs";
import { AuthButton } from "@/modules/auth/components/auth-button";
import { ProfileForm } from "./profile-form";

export function ProfileScreen() {
	const { user, loading, logout, logoutAll, refreshUser } = useAuth();

	useEffect(() => {
		void refreshUser();
	}, [refreshUser]);

	const confirmLogout = () => {
		Alert.alert("Sign out", "End this session on this device?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign out",
				style: "destructive",
				onPress: () => {
					void logout();
				},
			},
		]);
	};

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

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={styles.eyebrow}>ACCOUNT</Text>
							<Text style={styles.viewTitle}>Profile</Text>
							<Text style={styles.viewSubtitle}>
								Control how your identity appears across your personal OS.
							</Text>
						</View>

						{loading ? (
							<View className="h-64 items-center justify-center">
								<ActivityIndicator color={NeonColors.accent.green} />
							</View>
						) : !user ? (
							/* Guest / Unauthenticated State */
							<View className="gap-5">
								<NeonCard style={styles.heroCard}>
									<View style={styles.hero}>
										<View style={styles.avatarWrap}>
											<Image
												source={{ uri: "https://avatar.vercel.sh/guest" }}
												style={styles.avatar}
											/>
										</View>
										<Text style={styles.displayName}>Guest Session</Text>
										<Text style={styles.handle}>Local Profile Mode</Text>
										<Text style={styles.bio}>
											Sign in with your Personal OS account to sync your habits, finances, and data
											across all devices.
										</Text>
										<View className="w-full mt-4">
											<AuthButton
												label="Sign In / Register"
												onPress={() => router.push("/(auth)" as never)}
											/>
										</View>
									</View>
								</NeonCard>

								<View style={styles.section}>
									<Text style={styles.sectionLabel}>SYSTEM STATUS</Text>
									<NeonCard>
										<View style={styles.identityList}>
											<IdentityRow
												icon={CheckmarkCircle02Icon}
												label="API Connection"
												value="Online (v1)"
												accent={NeonColors.accent.green}
											/>
											<IdentityRow
												icon={Key01Icon}
												label="Session State"
												value="Local Workspace"
												last
											/>
										</View>
									</NeonCard>
								</View>
							</View>
						) : (
							/* Authenticated User Profile */
							<>
								<AccountTabs active="profile" />

								<NeonCard style={styles.heroCard}>
									<View style={styles.hero}>
										<View style={styles.avatarWrap}>
											<Image
												source={{
													uri:
														resolveMediaUrl(user.profile?.avatarUrl?.trim()) ||
														`https://avatar.vercel.sh/${encodeURIComponent(user.username)}`,
												}}
												style={styles.avatar}
											/>
											<View style={styles.onlineDot} />
										</View>
										<Text style={styles.displayName}>
											{user.profile?.displayName?.trim() || user.username}
										</Text>
										<Text style={styles.handle}>@{user.username}</Text>
										{user.profile?.bio ? <Text style={styles.bio}>{user.profile.bio}</Text> : null}
										<View style={styles.badgeRow}>
											<View
												style={[
													styles.badge,
													user.emailVerified ? styles.badgeOk : styles.badgeWarn,
												]}
											>
												<Icon
													icon={user.emailVerified ? CheckmarkCircle02Icon : Mail01Icon}
													size={12}
													color={
														user.emailVerified ? NeonColors.accent.green : NeonColors.accent.orange
													}
													strokeWidth={2.5}
												/>
												<Text
													style={[
														styles.badgeText,
														user.emailVerified ? styles.badgeOkText : styles.badgeWarnText,
													]}
												>
													{user.emailVerified ? "Email verified" : "Verify email"}
												</Text>
											</View>
											<View style={styles.badge}>
												<Icon
													icon={UserIcon}
													size={12}
													color={NeonColors.text.secondary}
													strokeWidth={2}
												/>
												<Text style={styles.badgeText}>
													{user.isActive ? "Active" : "Inactive"}
												</Text>
											</View>
										</View>
									</View>
								</NeonCard>

								<View style={styles.section}>
									<Text style={styles.sectionLabel}>PUBLIC PROFILE</Text>
									<NeonCard>
										<ProfileForm user={user} />
									</NeonCard>
								</View>

								<View style={styles.section}>
									<Text style={styles.sectionLabel}>ACCOUNT IDENTITY</Text>
									<NeonCard>
										<View style={styles.identityList}>
											<IdentityRow icon={Mail01Icon} label="Email" value={user.email} />
											<IdentityRow
												icon={CheckmarkCircle02Icon}
												label="Email status"
												value={user.emailVerified ? "Verified" : "Verification required"}
												accent={
													user.emailVerified ? NeonColors.accent.green : NeonColors.accent.orange
												}
											/>
											<IdentityRow
												icon={Calendar01Icon}
												label="Member since"
												value={new Date(user.createdAt).toLocaleDateString(undefined, {
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
												last
											/>
										</View>
									</NeonCard>
								</View>

								<View style={styles.section}>
									<Text style={styles.sectionLabel}>SESSION</Text>
									<NeonCard>
										<View style={styles.sessionActions}>
											<AuthButton label="Sign out" variant="outline" onPress={confirmLogout} />
											<Pressable style={styles.logoutAll} onPress={confirmLogoutAll}>
												<Icon
													icon={ShieldOffIcon}
													size={16}
													color={NeonColors.accent.red}
													strokeWidth={1.8}
												/>
												<Text style={styles.logoutAllText}>Sign out everywhere</Text>
											</Pressable>
											<View style={styles.logoutHint}>
												<Icon
													icon={Logout01Icon}
													size={14}
													color={NeonColors.text.muted}
													strokeWidth={1.8}
												/>
												<Text style={styles.logoutHintText}>
													Sign out ends only this device session
												</Text>
											</View>
										</View>
									</NeonCard>
								</View>
							</>
						)}
					</View>
				</ScrollView>
				<BottomNav activeTab="profile" />
			</SafeAreaView>
		</View>
	);
}

function IdentityRow({
	icon,
	label,
	value,
	accent,
	last = false,
}: {
	icon: IconProp;
	label: string;
	value: string;
	accent?: string;
	last?: boolean;
}) {
	return (
		<View style={[styles.identityRow, last && styles.identityRowLast]}>
			<View style={styles.identityIcon}>
				<Icon icon={icon} size={16} color={accent ?? NeonColors.text.secondary} strokeWidth={1.8} />
			</View>
			<View style={styles.identityCopy}>
				<Text style={styles.identityLabel}>{label}</Text>
				<Text style={[styles.identityValue, accent ? { color: accent } : null]}>{value}</Text>
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
	heroCard: {
		marginTop: 0,
	},
	hero: {
		alignItems: "center",
		gap: 8,
	},
	avatarWrap: {
		position: "relative",
		marginBottom: 8,
	},
	avatar: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: NeonColors.surface,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.08)",
	},
	onlineDot: {
		position: "absolute",
		right: 4,
		bottom: 4,
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: NeonColors.accent.green,
		borderWidth: 3,
		borderColor: NeonColors.background,
	},
	displayName: {
		color: NeonColors.text.primary,
		fontSize: 24,
		fontWeight: "300",
	},
	handle: {
		color: NeonColors.accent.green,
		fontSize: 14,
		fontWeight: "600",
		letterSpacing: 0.3,
	},
	bio: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		marginTop: 4,
		paddingHorizontal: 8,
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 8,
		marginTop: 12,
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.04)",
		borderWidth: 1,
		borderColor: NeonColors.card.border,
	},
	badgeOk: {
		borderColor: "rgba(0, 230, 118, 0.35)",
		backgroundColor: "rgba(0, 230, 118, 0.08)",
	},
	badgeWarn: {
		borderColor: "rgba(255, 109, 0, 0.35)",
		backgroundColor: "rgba(255, 109, 0, 0.08)",
	},
	badgeText: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "600",
	},
	badgeOkText: {
		color: NeonColors.accent.green,
	},
	badgeWarnText: {
		color: NeonColors.accent.orange,
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
	identityList: {
		gap: 4,
	},
	identityRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(255,255,255,0.06)",
	},
	identityRowLast: {
		borderBottomWidth: 0,
		paddingBottom: 0,
	},
	identityIcon: {
		width: 36,
		height: 36,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.04)",
		borderWidth: 1,
		borderColor: NeonColors.card.border,
	},
	identityCopy: {
		flex: 1,
		gap: 2,
	},
	identityLabel: {
		color: NeonColors.text.muted,
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 0.4,
		textTransform: "uppercase",
	},
	identityValue: {
		color: NeonColors.text.primary,
		fontSize: 14,
		fontWeight: "500",
	},
	sessionActions: {
		gap: 12,
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
	},
	logoutAllText: {
		color: NeonColors.accent.red,
		fontSize: 15,
		fontWeight: "700",
	},
	logoutHint: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingTop: 4,
	},
	logoutHintText: {
		color: NeonColors.text.muted,
		fontSize: 12,
	},
});
