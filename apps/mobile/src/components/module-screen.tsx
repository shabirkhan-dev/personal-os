import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/icons";
import { HeaderButton } from "@/components/ui/header-button";
import { PoText } from "@/components/ui/po-text";
import { AskAssistant } from "@/modules/assistant";
import type { AssistantPlace } from "@/modules/assistant/hooks/use-assistant";
import { FloatingTabBar } from "@/modules/home/components/floating-tab-bar";
import { InsightsSwitcher, insightsTabPress } from "@/modules/home/components/insights-switcher";
import { openAreas } from "@/modules/home/store/areas-picker";
import { Avatar } from "@/modules/onboarding/components/avatar";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { usePoTheme } from "@/theme";

export type ModuleScreenProps = {
	/** The module name in the header pill. */
	label: string;
	/** Where the Today tab goes. */
	onHome: () => void;
	children: ReactNode;
	/** The round button on the right of the header (Edit, Settings…). */
	action?: { icon: IconName; label: string; onPress: () => void };
	/** False for screens that size their own area (Tasbih counts taps anywhere). */
	scroll?: boolean;
	/**
	 * The module's Insights screen, or marks this as it (then the module switcher shows). Without
	 * one, the Insights tab goes to the last Insights opened.
	 */
	insights?: { onPress: () => void; active?: boolean };
	/** Shows the Ask button, opening the assistant about this screen. */
	assistant?: AssistantPlace;
};

/**
 * An inner module screen: the shared header (Back, the module pill, one action), a column with
 * the Figma 16px gutter, and the floating tab bar. The pill and the Areas tab both open the module
 * switcher, as they do on Home.
 */
export function ModuleScreen({
	label,
	onHome,
	children,
	action,
	scroll = true,
	insights,
	assistant,
}: ModuleScreenProps) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const name = useOnboardingStore((state) => state.name);

	const header = (
		<View style={styles.header}>
			<HeaderButton accessibilityLabel="Back" onPress={() => router.back()} />
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label}, switch area`}
				onPress={openAreas}
				style={[styles.pill, { backgroundColor: colors.bgSurface }]}
			>
				<Avatar name={name} size={32} />
				<PoText variant="text14Medium">{label}</PoText>
				<Icon name="Filled/Chevron down" size={16} color={colors.textSecondary} />
			</Pressable>
			{action ? (
				<HeaderButton
					icon={action.icon}
					accessibilityLabel={action.label}
					onPress={action.onPress}
				/>
			) : (
				<View style={styles.spacer} />
			)}
		</View>
	);
	const switcher = insights?.active ? <InsightsSwitcher /> : null;
	// Room for the tab bar, and the Ask button above it when there is one.
	const padding = {
		paddingTop: insets.top + 6,
		paddingBottom: (assistant ? 160 : 110) + insets.bottom,
	};

	return (
		<View style={[styles.root, { backgroundColor: colors.bgApp }]}>
			{scroll ? (
				<KeyboardAwareScrollView
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={[styles.content, padding]}
				>
					{header}
					{switcher}
					{children}
				</KeyboardAwareScrollView>
			) : (
				<View style={[styles.root, styles.content, padding]}>
					{header}
					{switcher}
					{children}
				</View>
			)}
			<FloatingTabBar
				active={insights?.active ? "insights" : "today"}
				bottomInset={insets.bottom}
				onTodayPress={onHome}
				onAreasPress={openAreas}
				onInsightsPress={insights?.onPress ?? insightsTabPress()}
				onProfilePress={() => router.push("/profile")}
			/>
			{assistant ? <AskAssistant place={assistant} /> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { gap: 16, paddingHorizontal: 16 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingBottom: 12,
	},
	pill: {
		height: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 4,
		paddingRight: 12,
		borderRadius: 999,
	},
	spacer: { width: 40, height: 40 },
});
