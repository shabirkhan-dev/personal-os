import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { usePoTheme } from "@/theme";
import type { MealSlot } from "../lib/meals";

const SLOT_LOOK: Record<
	MealSlot,
	{ icon: IconName; tint: keyof ColorTokens; background: keyof ColorTokens }
> = {
	breakfast: { icon: "Sun", tint: "statusCaution", background: "statusCautionSubtle" },
	lunch: { icon: "Food", tint: "statusCaution", background: "statusCautionSubtle" },
	snack: { icon: "Clock", tint: "textPrimary", background: "bgSubtle" },
	dinner: { icon: "Moon", tint: "statusViolet", background: "statusVioletSubtle" },
};

/** The 40px round glyph tile in front of each meal row. */
export function SlotIcon({ slot }: { slot: MealSlot }) {
	const { colors } = usePoTheme();
	const look = SLOT_LOOK[slot];
	return (
		<View style={[styles.tile, { backgroundColor: colors[look.background] }]}>
			<Icon name={look.icon} color={colors[look.tint]} />
		</View>
	);
}

const styles = StyleSheet.create({
	tile: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
