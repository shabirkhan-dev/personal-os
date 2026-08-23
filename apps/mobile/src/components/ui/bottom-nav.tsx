import {
	Calendar01Icon,
	Home01Icon,
	PlusSignIcon,
	UserIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconProp } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";

export interface BottomNavProps {
	activeTab?: "home" | "routines" | "finance" | "profile";
	onAddPress?: () => void;
}

interface TabItemConfig {
	id: "home" | "routines" | "finance" | "profile";
	label: string;
	icon: IconProp;
	route: string;
}

const TABS: TabItemConfig[] = [
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		route: "/(modules)/(dashboard)",
	},
	{
		id: "routines",
		label: "Routines",
		icon: Calendar01Icon,
		route: "/(modules)/(routines)",
	},
	{
		id: "finance",
		label: "Finance",
		icon: Wallet01Icon,
		route: "/(modules)/(expenses)",
	},
	{
		id: "profile",
		label: "Profile",
		icon: UserIcon,
		route: "/(modules)/(profile)",
	},
];

export function BottomNav({ activeTab, onAddPress }: BottomNavProps) {
	const insets = useSafeAreaInsets();
	const pathname = usePathname();

	const getActiveTab = (): "home" | "routines" | "finance" | "profile" => {
		if (activeTab) return activeTab;
		if (pathname.includes("(routines)")) return "routines";
		if (pathname.includes("(expenses)")) return "finance";
		if (pathname.includes("(profile)")) return "profile";
		return "home";
	};

	const currentActive = getActiveTab();

	const handleTabPress = (route: string) => {
		router.push(route as never);
	};

	const leftTabs = TABS.slice(0, 2);
	const rightTabs = TABS.slice(2, 4);

	return (
		<View
			style={[
				styles.container,
				{
					paddingBottom: Math.max(insets.bottom, 12),
				},
			]}
			className="bg-[#0B0C10]/95 border-t border-white/[0.07] flex-row items-center justify-around px-2 pt-2"
		>
			{/* Left 2 Tabs */}
			{leftTabs.map((tab) => {
				const isActive = currentActive === tab.id;
				return (
					<Pressable
						key={tab.id}
						onPress={() => handleTabPress(tab.route)}
						style={({ pressed }) => [styles.tabButton, { opacity: pressed ? 0.7 : 1 }]}
						className="flex-1 items-center justify-center py-1"
						accessibilityRole="button"
						accessibilityLabel={tab.label}
						accessibilityState={{ selected: isActive }}
					>
						<Icon
							icon={tab.icon}
							size={22}
							color={isActive ? NeonColors.text.primary : NeonColors.text.secondary}
							strokeWidth={isActive ? 2.2 : 1.6}
						/>
						<Text
							style={[
								styles.tabLabel,
								{
									color: isActive ? NeonColors.text.primary : NeonColors.text.secondary,
									fontWeight: isActive ? "600" : "400",
								},
							]}
							className="text-[10px] mt-1 tracking-tight"
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}

			{/* Center Quick Action Pill (+) */}
			<View className="items-center justify-center px-1">
				<Pressable
					onPress={onAddPress}
					style={({ pressed }) => [
						styles.centerPill,
						{
							transform: [{ scale: pressed ? 0.94 : 1 }],
						},
					]}
					className="w-[52px] h-[34px] bg-white rounded-full items-center justify-center shadow-lg"
					accessibilityRole="button"
					accessibilityLabel="Quick create new entry"
				>
					<Icon icon={PlusSignIcon} size={20} color="#0B0C10" strokeWidth={2.4} />
				</Pressable>
			</View>

			{/* Right 2 Tabs */}
			{rightTabs.map((tab) => {
				const isActive = currentActive === tab.id;
				return (
					<Pressable
						key={tab.id}
						onPress={() => handleTabPress(tab.route)}
						style={({ pressed }) => [styles.tabButton, { opacity: pressed ? 0.7 : 1 }]}
						className="flex-1 items-center justify-center py-1"
						accessibilityRole="button"
						accessibilityLabel={tab.label}
						accessibilityState={{ selected: isActive }}
					>
						<Icon
							icon={tab.icon}
							size={22}
							color={isActive ? NeonColors.text.primary : NeonColors.text.secondary}
							strokeWidth={isActive ? 2.2 : 1.6}
						/>
						<Text
							style={[
								styles.tabLabel,
								{
									color: isActive ? NeonColors.text.primary : NeonColors.text.secondary,
									fontWeight: isActive ? "600" : "400",
								},
							]}
							className="text-[10px] mt-1 tracking-tight"
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
		backgroundColor: "#0B0C10",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(255, 255, 255, 0.08)",
	},
	tabButton: {
		alignItems: "center",
		justifyContent: "center",
	},
	tabLabel: {
		fontSize: 10,
		letterSpacing: -0.2,
	},
	centerPill: {
		backgroundColor: "#FFFFFF",
		borderRadius: 9999,
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 4,
	},
});
