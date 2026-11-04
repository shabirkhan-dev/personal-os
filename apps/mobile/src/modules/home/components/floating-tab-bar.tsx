import { elevation } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { toShadowStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type TabId = "today" | "insights" | "profile";

type Tab = { id: TabId; label: string; icon: IconName };

const tabs: readonly Tab[] = [
	{ id: "today", label: "Today", icon: "Filled/Home" },
	{ id: "insights", label: "Insights", icon: "Filled/Chart" },
	{ id: "profile", label: "Profile", icon: "Filled/User" },
];

export type FloatingTabBarProps = {
	active: "today" | "insights" | "profile";
	bottomInset: number;
	onTodayPress?: () => void;
	/** Disabled only when none of the person's modules has Insights. */
	onInsightsPress?: () => void;
	onProfilePress?: () => void;
};

/**
 * Kit v2 "Floating Tab Bar": Today, Insights and Profile (the header's grid button switches
 * modules). Insights opens this module's Insights
 * or the last one opened. A tab without a handler is disabled. It sits just above the home
 * indicator.
 */
export function FloatingTabBar({
	active: activeTab,
	bottomInset,
	onTodayPress,
	onInsightsPress,
	onProfilePress,
}: FloatingTabBarProps) {
	const { colors } = usePoTheme();
	const handlers: Partial<Record<TabId, () => void>> = {
		today: onTodayPress,
		insights: onInsightsPress,
		profile: onProfilePress,
	};

	return (
		<View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(12, bottomInset + 2) }]}>
			<View
				accessibilityRole="tablist"
				style={[styles.bar, { backgroundColor: colors.bgSurface }, toShadowStyle(elevation.tabBar)]}
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
								active ? { backgroundColor: colors.accentSubtle } : styles.inactive,
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
		gap: 2,
		padding: 4,
		borderRadius: 999,
	},
	active: {
		height: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 16,
		paddingRight: 16,
		borderRadius: 22,
	},
	icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
	inactive: { opacity: 0.45 },
});
