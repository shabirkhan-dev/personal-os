import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { GLASS_ML, litres, waterGlasses } from "../lib/meals";

export type WaterCardProps = {
	ml: number;
	goalMl: number;
	onAdd: () => void;
	/** Opens the water sheet to remove or set an amount. */
	onEdit: () => void;
};

/** Figma "Water": litres against the goal, one dot per 250 ml glass, and a + button. */
export function WaterCard({ ml, goalMl, onAdd, onEdit }: WaterCardProps) {
	const { colors } = usePoTheme();
	const glasses = waterGlasses(ml, goalMl);

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Water, ${litres(ml)} of ${litres(goalMl)} litres`}
				accessibilityHint="Opens water to remove or change today's amount"
				onPress={onEdit}
				style={styles.body}
			>
				<View style={[styles.icon, { backgroundColor: colors.accentSubtle }]}>
					<Icon name="Drop" color={colors.accentDefault} />
				</View>
				<View style={styles.text}>
					<View style={styles.number}>
						<PoText variant="row15">{litres(ml)}</PoText>
						<PoText variant="meta13" tone="textTertiary">
							/ {litres(goalMl)} L water
						</PoText>
					</View>
					<View style={styles.glasses}>
						{Array.from({ length: glasses.total }, (_, index) => (
							<View
								// Glasses are positional and never reorder.
								key={index}
								style={[
									styles.glass,
									{
										backgroundColor:
											index < glasses.filled ? colors.accentDefault : colors.bgSubtle,
									},
								]}
							/>
						))}
					</View>
				</View>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Add ${GLASS_ML} ml of water`}
				accessibilityHint="Long press to change today's amount"
				hitSlop={4}
				onPress={() => {
					haptics.tap();
					onAdd();
				}}
				onLongPress={() => {
					haptics.select();
					onEdit();
				}}
				style={({ pressed }) => [
					styles.add,
					{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
				]}
			>
				<Icon name="Filled/Plus" size={16} color={colors.textPrimary} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 10,
		paddingRight: 8,
		paddingVertical: 10,
		borderRadius: 32,
		borderWidth: 1,
	},
	body: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, gap: 6 },
	number: { flexDirection: "row", alignItems: "baseline", gap: 3 },
	glasses: { flexDirection: "row", gap: 4 },
	glass: { flex: 1, maxWidth: 14, height: 6, borderRadius: 3 },
	add: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
