import {
	Activity01Icon,
	Analytics01Icon,
	Home01Icon,
	PlusSignIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";

export function BottomNav() {
	const tabs = [
		{ icon: Home01Icon, label: "Home", active: true },
		{ icon: Analytics01Icon, label: "Stats", active: false },
		{ icon: PlusSignIcon, label: "Add", isCenter: true },
		{ icon: Activity01Icon, label: "Logs", active: false },
		{ icon: UserIcon, label: "Me", active: false },
	];

	return (
		<View style={styles.container}>
			{tabs.map((tab, _i) => (
				<Pressable key={tab.label} style={[styles.tab, tab.isCenter && styles.centerTab]}>
					{tab.isCenter ? (
						<View style={styles.centerButton}>
							<Icon icon={PlusSignIcon} size={28} color={NeonColors.background} strokeWidth={2.5} />
						</View>
					) : (
						<>
							<tab.icon
								size={22}
								color={tab.active ? NeonColors.accent.green : NeonColors.text.muted}
								strokeWidth={tab.active ? 2 : 1.5}
							/>
							<Text
								style={[
									styles.label,
									{ color: tab.active ? NeonColors.accent.green : NeonColors.text.muted },
								]}
							>
								{tab.label}
							</Text>
						</>
					)}
				</Pressable>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		height: 84,
		backgroundColor: NeonColors.background,
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.05)",
		paddingBottom: 24,
		paddingHorizontal: 12,
	},
	tab: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 4,
	},
	centerTab: {
		justifyContent: "flex-start",
		marginTop: -20,
	},
	centerButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: NeonColors.accent.green,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: NeonColors.accent.green,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	label: {
		fontSize: 10,
		fontWeight: "600",
	},
});
