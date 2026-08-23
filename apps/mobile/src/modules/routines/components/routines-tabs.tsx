import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/theme-provider";

export type RoutineTab = "today" | "habits";

interface RoutinesTabsProps {
	active: RoutineTab;
}

const TABS: Array<{ id: RoutineTab; label: string; route: string }> = [
	{ id: "today", label: "Today", route: "/(modules)/(routines)" },
	{ id: "habits", label: "All Routines", route: "/(modules)/(routines)/habits" },
];

export function RoutinesTabs({ active }: RoutinesTabsProps) {
	const { colors, isDark } = useTheme();

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
					borderColor: colors.card.border,
				},
			]}
		>
			{TABS.map((tab) => {
				const isSelected = active === tab.id;
				return (
					<Pressable
						key={tab.id}
						onPress={() => {
							if (!isSelected) {
								router.push(tab.route as never);
							}
						}}
						style={[
							styles.tab,
							isSelected && [
								styles.activeTab,
								{
									backgroundColor: isDark ? "#FFFFFF" : "#0F172A",
								},
							],
						]}
					>
						<Text
							style={{
								color: isSelected ? (isDark ? "#000000" : "#FFFFFF") : colors.text.secondary,
								fontWeight: isSelected ? "700" : "500",
							}}
							className="text-xs tracking-tight"
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		padding: 4,
		borderRadius: 16,
		marginBottom: 16,
		borderWidth: 1,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	activeTab: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
});
