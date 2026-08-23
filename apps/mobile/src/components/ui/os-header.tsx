import {
	ArrowDown01Icon,
	Notification01Icon,
	ScanIcon,
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
import { NeonColors } from "@/constants/design-system";
import { resolveMediaUrl } from "@/lib/media-url";
import { useAuth } from "@/modules/auth";

export type OSModule =
	| "Dashboard"
	| "Profile"
	| "Skincare"
	| "Exercise"
	| "Expenses"
	| "Nutrition"
	| "Mindfulness"
	| "Focus"
	| "Library";

export function OSHeader() {
	const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
	const segments = useSegments() as string[];
	const { user } = useAuth();

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
		if (segments.includes("(skincare)")) return "Skincare";
		if (segments.includes("(exercise)")) return "Exercise";
		if (segments.includes("(expenses)")) return "Expenses";
		if (segments.includes("(nutrition)")) return "Nutrition";
		if (segments.includes("(mindfulness)")) return "Mindfulness";
		if (segments.includes("(focus)")) return "Focus";
		if (segments.includes("(library)")) return "Library";
		return "Dashboard";
	}, [segments]);

	const modules: { label: OSModule; route: Href }[] = [
		{ label: "Dashboard", route: "/(modules)/(dashboard)" },
		{ label: "Profile", route: "/(modules)/(profile)" as Href },
		{ label: "Focus", route: "/(modules)/(focus)" },
		{ label: "Library", route: "/(modules)/(library)" },
		{ label: "Skincare", route: "/(modules)/(skincare)" },
		{ label: "Exercise", route: "/(modules)/(exercise)" },
		{ label: "Expenses", route: "/(modules)/(expenses)" },
		{ label: "Nutrition", route: "/(modules)/(nutrition)" },
		{ label: "Mindfulness", route: "/(modules)/(mindfulness)" },
	];

	const handleSelect = (route: Href) => {
		router.replace(route);
		setIsDropdownOpen(false);
	};

	return (
		<View style={styles.container}>
			<View style={styles.left}>
				<Pressable style={styles.avatarContainer} onPress={handleAvatarPress}>
					<Image source={{ uri: avatarUri }} style={styles.avatar} />
					<View style={styles.onlineDot} />
				</Pressable>

				<View style={styles.dropdownContainer}>
					<Pressable style={styles.accountSelector} onPress={() => setIsDropdownOpen(true)}>
						<Text style={styles.accountName}>{currentModule}</Text>
						<Icon icon={ArrowDown01Icon} size={16} color={NeonColors.text.secondary} />
					</Pressable>

					<Modal
						visible={isDropdownOpen}
						transparent={true}
						animationType="fade"
						onRequestClose={() => setIsDropdownOpen(false)}
					>
						<TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
							<View style={styles.modalOverlay}>
								<View style={styles.dropdownMenu}>
									{modules.map((mod) => (
										<Pressable
											key={mod.label}
											style={styles.dropdownItem}
											onPress={() => handleSelect(mod.route)}
										>
											<Text
												style={[
													styles.dropdownItemText,
													currentModule === mod.label && styles.activeDropdownItemText,
												]}
											>
												{mod.label}
											</Text>
											{currentModule === mod.label && (
												<Icon
													icon={Tick01Icon}
													size={16}
													color={NeonColors.accent.green}
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
				<Pressable style={styles.iconButton}>
					<Icon icon={ScanIcon} size={22} color={NeonColors.text.primary} strokeWidth={1.5} />
				</Pressable>
				<View style={styles.notificationContainer}>
					<Pressable style={styles.iconButton}>
						<Icon
							icon={Notification01Icon}
							size={22}
							color={NeonColors.text.primary}
							strokeWidth={1.5}
						/>
					</Pressable>
					<View style={styles.badge} />
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
		backgroundColor: NeonColors.surface,
	},
	onlineDot: {
		position: "absolute",
		bottom: 0,
		right: 0,
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: NeonColors.accent.green,
		borderWidth: 2,
		borderColor: NeonColors.background,
	},
	dropdownContainer: {
		position: "relative",
	},
	accountSelector: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: NeonColors.surface,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.05)",
	},
	accountName: {
		color: NeonColors.text.primary,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
		justifyContent: "flex-start",
		paddingTop: 60,
		paddingLeft: 64,
	},
	dropdownMenu: {
		width: 180,
		backgroundColor: NeonColors.surface,
		borderRadius: 16,
		padding: 8,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.5,
		shadowRadius: 20,
		elevation: 10,
	},
	dropdownItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 8,
	},
	dropdownItemText: {
		color: NeonColors.text.secondary,
		fontSize: 15,
		fontWeight: "500",
	},
	activeDropdownItemText: {
		color: NeonColors.text.primary,
		fontWeight: "700",
	},
	right: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	iconButton: {
		padding: 4,
	},
	notificationContainer: {
		position: "relative",
	},
	badge: {
		position: "absolute",
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: NeonColors.accent.green,
		borderWidth: 1.5,
		borderColor: NeonColors.background,
	},
});
