import { elevation } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { toShadowStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type TabId = "today" | "areas" | "insights" | "profile";

type Tab = { id: TabId; label: string; icon: IconName };

const tabs: readonly Tab[] = [
	{ id: "today", label: "Today", icon: "Filled/Home" },
	{ id: "areas", label: "Areas", icon: "Filled/Grid" },
	{ id: "insights", label: "Insights", icon: "Filled/Chart" },
	{ id: "profile", label: "Profile", icon: "Filled/User" },
];

export type FloatingTabBarProps = {
	active: "today" | "profile";
	bottomInset: number;
	onTodayPress?: () => void;
	onAreasPress?: () => void;
	onProfilePress?: () => void;
};

/**
 * Kit v2 "Floating Tab Bar". Areas opens the module picker; Insights is shown disabled until it
 * exists. It sits just above the home indicator.
 */
export function FloatingTabBar({
	active: activeTab,
	bottomInset,
	onTodayPress,
	onAreasPress,
	onProfilePress,
}: FloatingTabBarProps) {
	const { colors } = usePoTheme();
	const handlers: Partial<Record<TabId, () => void>> = {
		today: onTodayPress,
		areas: onAreasPress,
		profile: onProfilePress,
	};

	return (
		<View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(12, bottomInset + 2) }]}>
			<View
				accessibilityRole="tablist"
				style={[
					styles.bar,
					{ backgroundColor: colors.bgApp, borderColor: colors.borderDefault },
					toShadowStyle(elevation.tabBar),
				]}
			>
				{tabs.map((tab) => {
					const active = tab.id === activeTab;
					const onPress = handlers[tab.id];
					const disabled = !active && !onPress;
					return (
						<Pressable
							key={tab.id}
							accessibilityRole="tab"
							accessibilityLabel={tab.label}
							accessibilityState={{ selected: active, disabled }}
							disabled={disabled}
							onPress={
								onPress && !active
									? () => {
											haptics.tap();
											onPress();
										}
									: undefined
							}
							style={[
								active ? styles.active : styles.icon,
								active ? { backgroundColor: colors.bgHover } : styles.inactive,
							]}
						>
							<Icon name={tab.icon} color={active ? colors.textLink : colors.textPrimary} />
							{active ? (
								<PoText variant="row15" tone="textLink">
									{tab.label}
								</PoText>
							) : null}
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
	bar: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		padding: 6,
		borderRadius: 32,
		borderWidth: 1,
	},
	active: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 18,
		paddingRight: 20,
		borderRadius: 26,
	},
	icon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
	inactive: { opacity: 0.45 },
});
