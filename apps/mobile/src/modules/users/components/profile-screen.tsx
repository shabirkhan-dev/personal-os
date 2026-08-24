import {
	Calendar01Icon,
	CheckmarkCircle02Icon,
	Key01Icon,
	Logout01Icon,
	Mail01Icon,
	Moon02Icon,
	ShieldOffIcon,
	Sun01Icon,
} from "@hugeicons/core-free-icons";
import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconProp } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth";
import { AccountTabs } from "@/modules/auth/components/account-tabs";
import { AuthButton } from "@/modules/auth/components/auth-button";
import { useTheme } from "@/providers/theme-provider";
import { ProfileForm } from "./profile-form";

export function ProfileScreen() {
	const { user, loading, logout, logoutAll, refreshUser } = useAuth();
	const segments = useSegments() as string[];

	useEffect(() => {
		if (segments.includes("(profile)") && user) {
			void refreshUser();
		}
	}, [segments, user, refreshUser]);

	const confirmLogout = () => {
		Alert.alert("Sign out", "Are you sure you want to sign out of this device?", [
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
		Alert.alert("Sign out everywhere", "Revoke all active sessions on every device?", [
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
							<Text className="text-foreground text-3xl font-light tracking-tight">Profile</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Control how your identity appears across your personal OS.
							</Text>
						</View>

						{loading ? (
							<View className="h-64 items-center justify-center">
								<ActivityIndicator className="text-primary" />
							</View>
						) : !user ? (
							/* Guest / Unauthenticated State */
							<View className="gap-5">
								<Card className="items-center text-center p-6">
									<View className="relative mb-3">
										<Image
											source={{ uri: "https://avatar.vercel.sh/guest" }}
											className="w-20 h-20 rounded-full border-2 border-border"
										/>
									</View>
									<Text className="text-foreground text-xl font-bold">Guest Session</Text>
									<Text className="text-muted-foreground text-xs font-semibold mb-2">
										Local Profile Mode
									</Text>
									<Text className="text-muted-foreground text-xs text-center leading-relaxed mb-4">
										Sign in with your Personal OS account to sync your habits, finances, and data
										across all devices.
									</Text>
									<View className="w-full">
										<AuthButton
											label="Sign In / Register"
											onPress={() => router.push("/(auth)" as never)}
										/>
									</View>
								</Card>

								<View className="mb-4">
									<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
										SYSTEM STATUS
									</Text>
									<Card className="p-4 gap-3">
										<IdentityRow
											icon={CheckmarkCircle02Icon}
											label="API Connection"
											value="Online (v1)"
										/>
										<IdentityRow
											icon={Key01Icon}
											label="Session State"
											value="Local Workspace"
											last
										/>
									</Card>
								</View>

								<AppearanceSection />
							</View>
						) : (
							/* Authenticated User Profile */
							<>
								<AccountTabs active="profile" />

								{/* Hero Avatar Profile Card */}
								<Card className="items-center text-center p-6 mb-5">
									<View className="relative mb-3">
										<Image
											source={{
												uri:
													resolveMediaUrl(user.profile?.avatarUrl?.trim()) ||
													`https://avatar.vercel.sh/${encodeURIComponent(user.username)}`,
											}}
											className="w-20 h-20 rounded-full border-2 border-border"
										/>
										<View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
									</View>
									<Text className="text-foreground text-xl font-bold">
										{user.profile?.displayName?.trim() || user.username}
									</Text>
									<Text className="text-muted-foreground text-xs font-semibold mb-2">
										@{user.username}
									</Text>
									{user.profile?.bio ? (
										<Text className="text-muted-foreground text-xs text-center leading-relaxed mb-3">
											{user.profile.bio}
										</Text>
									) : null}
									<View className="flex-row items-center gap-2 flex-wrap justify-center mb-1">
										<Badge variant={user.emailVerified ? "success" : "warning"}>
											{user.emailVerified ? "Email verified" : "Verify email"}
										</Badge>
										<Badge variant="secondary">{user.isActive ? "Active" : "Inactive"}</Badge>
									</View>
								</Card>

								{/* Edit Profile Form */}
								<View className="mb-5">
									<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
										EDIT PROFILE
									</Text>
									<Card className="p-5">
										<ProfileForm user={user} />
									</Card>
								</View>

								{/* Account & Identity Metadata */}
								<View className="mb-5">
									<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
										ACCOUNT & IDENTITY
									</Text>
									<Card className="p-4 gap-3">
										<IdentityRow icon={Mail01Icon} label="Email" value={user.email} />
										<IdentityRow
											icon={Calendar01Icon}
											label="Member since"
											value={new Date(user.createdAt).toLocaleDateString(undefined, {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										/>
										<IdentityRow
											icon={CheckmarkCircle02Icon}
											label="Timezone"
											value={user.profile?.timezone || "UTC"}
										/>
										<IdentityRow
											icon={CheckmarkCircle02Icon}
											label="Locale"
											value={user.profile?.locale || "en-US"}
											last
										/>
									</Card>
								</View>

								{/* Appearance / Theme Selector */}
								<AppearanceSection />

								{/* Sign Out Section */}
								<View className="mb-6 gap-3">
									<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
										SESSION MANAGEMENT
									</Text>
									<Button
										variant="outline"
										onPress={confirmLogout}
										className="border-destructive/40"
									>
										<Icon icon={Logout01Icon} size={16} className="text-destructive" />
										<Text className="text-destructive font-bold text-sm">
											Sign out of this device
										</Text>
									</Button>
									<Button variant="ghost" onPress={confirmLogoutAll}>
										<Icon icon={ShieldOffIcon} size={16} className="text-muted-foreground" />
										<Text className="text-muted-foreground font-semibold text-xs">
											Sign out of all devices
										</Text>
									</Button>
								</View>
							</>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

function IdentityRow({
	icon,
	label,
	value,
	last = false,
}: {
	icon: IconProp;
	label: string;
	value: string;
	last?: boolean;
}) {
	return (
		<View
			className={cn(
				"flex-row items-center justify-between py-2",
				!last && "border-b border-border/40 pb-3",
			)}
		>
			<View className="flex-row items-center gap-2.5 flex-1 pr-2">
				<Icon icon={icon} size={16} className="text-muted-foreground" />
				<Text className="text-muted-foreground text-xs font-medium">{label}</Text>
			</View>
			<Text className="text-foreground text-xs font-bold" numberOfLines={1}>
				{value}
			</Text>
		</View>
	);
}

function AppearanceSection() {
	const { theme, setTheme } = useTheme();

	return (
		<View className="mb-5">
			<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
				APPEARANCE
			</Text>
			<Card className="p-4">
				<Text className="text-foreground text-sm font-semibold mb-1">Theme Mode</Text>
				<Text className="text-muted-foreground text-xs mb-3">
					Switch between Dark, Light, or System appearance.
				</Text>
				<View className="flex-row gap-2">
					<Pressable
						onPress={() => setTheme("dark")}
						className={cn(
							"flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-1.5",
							theme === "dark" ? "bg-primary/15 border-primary" : "bg-muted/40 border-border",
						)}
					>
						<Icon
							icon={Moon02Icon}
							size={16}
							className={theme === "dark" ? "text-primary" : "text-muted-foreground"}
						/>
						<Text
							className={cn(
								"text-xs font-bold",
								theme === "dark" ? "text-primary" : "text-muted-foreground",
							)}
						>
							Dark
						</Text>
					</Pressable>

					<Pressable
						onPress={() => setTheme("light")}
						className={cn(
							"flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-1.5",
							theme === "light" ? "bg-primary/15 border-primary" : "bg-muted/40 border-border",
						)}
					>
						<Icon
							icon={Sun01Icon}
							size={16}
							className={theme === "light" ? "text-primary" : "text-muted-foreground"}
						/>
						<Text
							className={cn(
								"text-xs font-bold",
								theme === "light" ? "text-primary" : "text-muted-foreground",
							)}
						>
							Light
						</Text>
					</Pressable>

					<Pressable
						onPress={() => setTheme("system")}
						className={cn(
							"flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-center gap-1.5",
							theme === "system" ? "bg-primary/15 border-primary" : "bg-muted/40 border-border",
						)}
					>
						<Text
							className={cn(
								"text-xs font-bold",
								theme === "system" ? "text-primary" : "text-muted-foreground",
							)}
						>
							Auto
						</Text>
					</Pressable>
				</View>
			</Card>
		</View>
	);
}
