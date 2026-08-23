import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/theme-provider";

type AccountTab = "profile" | "security" | "billing";

export function AccountTabs({ active }: { active: AccountTab }) {
	const { colors, isDark } = useTheme();

	return (
		<View
			style={[
				styles.row,
				{
					borderColor: colors.card.border,
					backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
				},
			]}
		>
			<Tab
				label="Profile"
				active={active === "profile"}
				onPress={() => router.replace("/(modules)/(profile)")}
			/>
			<Tab
				label="Security"
				active={active === "security"}
				onPress={() => router.replace("/(modules)/(profile)/security")}
			/>
			<Tab
				label="Billing"
				active={active === "billing"}
				onPress={() => router.replace("/(modules)/(profile)/billing")}
			/>
		</View>
	);
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
		>
			<Text
				style={[
					styles.label,
					{ color: active ? colors.accent.green : colors.text.secondary },
					active && styles.labelActive,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: 6,
		padding: 4,
		borderRadius: 14,
		borderWidth: 1,
	},
	tab: {
		flex: 1,
		minHeight: 40,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	tabActive: {
		backgroundColor: "rgba(0, 230, 118, 0.12)",
		borderWidth: 1,
		borderColor: "rgba(0, 230, 118, 0.35)",
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
	},
	labelActive: {
		fontWeight: "700",
	},
	pressed: {
		opacity: 0.85,
	},
});
