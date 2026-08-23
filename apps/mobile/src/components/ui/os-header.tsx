import {
	ArrowDown01Icon,
	Moon02Icon,
	Notification01Icon,
	Sun01Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { type Href, router, useSegments } from "expo-router";
import * as React from "react";
import {
	Image,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { resolveMediaUrl } from "@/lib/media-url";
import { useAuth } from "@/modules/auth";
import { useTheme } from "@/providers/theme-provider";

export type OSModule = "Dashboard" | "Routines" | "Finance" | "Profile";

export function OSHeader() {
	const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
	const segments = useSegments() as string[];
	const { user } = useAuth();
	const { isDark, colors, toggleTheme } = useTheme();

	const avatarUri =
		resolveMediaUrl(user?.profile?.avatarUrl?.trim()) ||
		(user
			? `https://avatar.vercel.sh/${encodeURIComponent(user.username)}`
			: "https://avatar.vercel.sh/guest");

	const handleAvatarPress = () => {
		router.replace("/(modules)/(profile)" as Href);
	};

	const currentModule: OSModule = React.useMemo(() => {
		if (segments.includes("(profile)")) return "Profile";
		if (segments.includes("(routines)")) return "Routines";
		if (segments.includes("(expenses)")) return "Finance";
		return "Dashboard";
	}, [segments]);

	const modules: { label: OSModule; route: Href }[] = [
		{ label: "Dashboard", route: "/(modules)/(dashboard)" },
		{ label: "Routines", route: "/(modules)/(routines)" },
		{ label: "Finance", route: "/(modules)/(expenses)" },
		{ label: "Profile", route: "/(modules)/(profile)" as Href },
	];

	const handleSelect = (route: Href) => {
		router.replace(route);
		setIsDropdownOpen(false);
	};

	return (
		<View style={[styles.container, { borderBottomColor: colors.card.border }]}>
			<View style={styles.left}>
				<Pressable style={styles.avatarContainer} onPress={handleAvatarPress}>
					<Image
						source={{ uri: avatarUri }}
						style={[styles.avatar, { backgroundColor: colors.surface }]}
					/>
					<View
						style={[
							styles.onlineDot,
							{
								backgroundColor: colors.accent.green,
								borderColor: colors.background,
							},
						]}
					/>
				</Pressable>

				<View style={styles.dropdownContainer}>
					<Pressable
						style={[
							styles.accountSelector,
							{
								backgroundColor: colors.surface,
								borderColor: colors.card.border,
							},
						]}
						onPress={() => setIsDropdownOpen(true)}
					>
						<Text style={[styles.accountName, { color: colors.text.primary }]}>
							{currentModule}
						</Text>
						<Icon icon={ArrowDown01Icon} size={16} color={colors.text.secondary} />
					</Pressable>

					<Modal
						visible={isDropdownOpen}
						transparent={true}
						animationType="fade"
						onRequestClose={() => setIsDropdownOpen(false)}
					>
						<TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
							<View style={styles.modalOverlay}>
								<View
									style={[
										styles.dropdownMenu,
										{
											backgroundColor: colors.surface,
											borderColor: colors.card.border,
										},
									]}
								>
									{modules.map((mod) => (
										<Pressable
											key={mod.label}
											style={styles.dropdownItem}
											onPress={() => handleSelect(mod.route)}
										>
											<Text
												style={[
													styles.dropdownItemText,
													{
														color:
															currentModule === mod.label
																? colors.text.primary
																: colors.text.secondary,
														fontWeight: currentModule === mod.label ? "700" : "500",
													},
												]}
											>
												{mod.label}
											</Text>
											{currentModule === mod.label && (
												<Icon
													icon={Tick01Icon}
													size={16}
													color={colors.accent.green}
													strokeWidth={3}
												/>
											)}
										</Pressable>
									))}
								</View>
							</View>
						</TouchableWithoutFeedback>
					</Modal>
				</View>
			</View>

			<View style={styles.right}>
				<Pressable
					style={[
						styles.themeToggleBtn,
						{
							backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
						},
					]}
					onPress={toggleTheme}
					accessibilityRole="button"
					accessibilityLabel={`Switch to ${isDark ? "light" : "dark"} mode`}
				>
					<Icon
						icon={isDark ? Sun01Icon : Moon02Icon}
						size={20}
						color={isDark ? "#FFEA00" : "#00B0FF"}
						strokeWidth={2}
					/>
				</Pressable>
				<View style={styles.notificationContainer}>
					<Pressable
						style={[
							styles.iconButton,
							{
								backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
							},
						]}
					>
						<Icon
							icon={Notification01Icon}
							size={20}
							color={colors.text.primary}
							strokeWidth={1.8}
						/>
					</Pressable>
					<View
						style={[
							styles.badge,
							{
								backgroundColor: colors.accent.green,
								borderColor: colors.background,
							},
						]}
					/>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		zIndex: 100,
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	avatarContainer: {
		position: "relative",
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	onlineDot: {
		position: "absolute",
		bottom: 0,
		right: 0,
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 2,
	},
	dropdownContainer: {
		position: "relative",
	},
	accountSelector: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
	},
	accountName: {
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		justifyContent: "flex-start",
		paddingTop: 60,
		paddingLeft: 64,
	},
	dropdownMenu: {
		width: 180,
		borderRadius: 16,
		padding: 8,
		borderWidth: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 10,
	},
	dropdownItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
	},
	dropdownItemText: {
		fontSize: 15,
	},
	right: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	iconButton: {
		padding: 7,
		borderRadius: 12,
	},
	themeToggleBtn: {
		padding: 7,
		borderRadius: 12,
	},
	notificationContainer: {
		position: "relative",
	},
	badge: {
		position: "absolute",
		top: 3,
		right: 3,
		width: 8,
		height: 8,
		borderRadius: 4,
		borderWidth: 1.5,
	},
});
