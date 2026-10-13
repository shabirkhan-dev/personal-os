import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Glow } from "@/components/ui/glow";
import { HeaderButton } from "@/components/ui/header-button";
import { PoText } from "@/components/ui/po-text";
import { Avatar } from "@/modules/onboarding/components/avatar";
import { usePoTheme } from "@/theme";

export type HomeHeaderProps = {
	name: string;
	topInset: number;
	/** Whether the module picker is open (the Apps button turns inverse). */
	pickerOpen: boolean;
	onAppsPress: () => void;
	onProfilePress: () => void;
	onNotificationsPress: () => void;
};

/** Kit v2 "Home Header": glow, Apps button, profile pill and notifications. */
export function HomeHeader({
	name,
	topInset,
	pickerOpen,
	onAppsPress,
	onProfilePress,
	onNotificationsPress,
}: HomeHeaderProps) {
	const { colors } = usePoTheme();
	const firstName = name.trim().split(/\s+/)[0] || "You";

	return (
		<View style={[styles.header, { paddingTop: topInset + 16 }]}>
			<Glow tone="accentDefault" width={340} height={240} left={-90} top={-110} blur={110} />
			<View style={styles.row}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={pickerOpen ? "Close modules" : "Open modules"}
					accessibilityState={{ expanded: pickerOpen }}
					hitSlop={8}
					onPress={onAppsPress}
					style={[
						styles.round,
						pickerOpen
							? { backgroundColor: colors.bgInverse, borderColor: colors.bgInverse }
							: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<Icon name="Filled/Grid" color={pickerOpen ? colors.textInverse : colors.textPrimary} />
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Profile, ${firstName}`}
					onPress={onProfilePress}
					style={({ pressed }) => [
						styles.pill,
						{
							backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
							borderColor: colors.borderDefault,
						},
					]}
				>
					<Avatar name={name} size={32} />
					<PoText variant="text14Medium" numberOfLines={1} style={styles.name}>
						{firstName}
					</PoText>
					<Icon name="Filled/Chevron down" size={16} color={colors.textSecondary} />
				</Pressable>
				<HeaderButton
					icon="Filled/Bell"
					accessibilityLabel="Notifications"
					onPress={onNotificationsPress}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: { alignItems: "center", paddingBottom: 20, paddingHorizontal: 24 },
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	round: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	pill: {
		height: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 4,
		paddingRight: 12,
		borderRadius: 999,
		borderWidth: 1,
	},
	name: { maxWidth: 140 },
});
