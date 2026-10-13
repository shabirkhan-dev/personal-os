import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

type Row = {
	title: string;
	meta: string;
	value: string;
	icon: IconName;
	iconTone: keyof ColorTokens;
	tileTone: keyof ColorTokens;
	dimmed?: boolean;
};

const rows: readonly Row[] = [
	{
		title: "Daily life",
		meta: "4 of 6 done today",
		value: "67%",
		icon: "Sun",
		iconTone: "statusSuccess",
		tileTone: "statusSuccessSubtle",
	},
	{
		title: "Finance",
		meta: "Rs 42,300 left this month",
		value: "62%",
		icon: "Wallet",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
	},
	{
		title: "Workout",
		meta: "Push day at 18:30",
		value: "3/4",
		icon: "Dumbbell",
		iconTone: "statusDanger",
		tileTone: "bgSubtle",
	},
	{
		title: "Skincare",
		meta: "PM routine at 22:00",
		value: "12d",
		icon: "Drop",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
		dimmed: true,
	},
];

/** Frame 02 preview: four module pill rows. */
export function ModuleRowsPreview() {
	const { colors } = usePoTheme();

	return (
		<View style={styles.list}>
			{rows.map((row, index) => (
				<Animated.View
					key={row.title}
					entering={FadeInDown.duration(420).delay(80 * index)}
					style={[
						styles.row,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						row.dimmed ? styles.dimmed : null,
					]}
				>
					<View style={[styles.tile, { backgroundColor: colors[row.tileTone] }]}>
						<Icon name={row.icon} color={colors[row.iconTone]} />
					</View>
					<View style={styles.text}>
						<PoText variant="row15" numberOfLines={1}>
							{row.title}
						</PoText>
						<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
							{row.meta}
						</PoText>
					</View>
					<PoText variant="mono13" tone="textSecondary">
						{row.value}
					</PoText>
				</Animated.View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: { gap: 10 },
	row: {
		height: 64,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 18,
		borderRadius: 32,
		borderWidth: 1,
	},
	dimmed: { opacity: 0.45 },
	tile: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, gap: 2 },
});
