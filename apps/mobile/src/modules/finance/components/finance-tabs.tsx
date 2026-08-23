import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NeonColors } from "@/constants/design-system";

export type FinanceTab = "overview" | "transactions" | "budget";

interface FinanceTabsProps {
	active: FinanceTab;
}

const TABS: Array<{ id: FinanceTab; label: string; route: string }> = [
	{ id: "overview", label: "Overview", route: "/(modules)/(expenses)" },
	{ id: "transactions", label: "Transactions", route: "/(modules)/(expenses)/transactions" },
	{ id: "budget", label: "Budgets", route: "/(modules)/(expenses)/budget" },
];

export function FinanceTabs({ active }: FinanceTabsProps) {
	return (
		<View
			style={styles.container}
			className="flex-row p-1 bg-[#15161A] rounded-2xl mb-4 border border-white/[0.06]"
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
						style={[styles.tab, isSelected && styles.activeTab]}
						className="flex-1 py-2.5 rounded-xl items-center justify-center"
					>
						<Text
							style={{
								color: isSelected ? "#000000" : NeonColors.text.secondary,
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
		backgroundColor: "#15161A",
	},
	tab: {
		borderRadius: 12,
	},
	activeTab: {
		backgroundColor: "#FFFFFF",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
});
