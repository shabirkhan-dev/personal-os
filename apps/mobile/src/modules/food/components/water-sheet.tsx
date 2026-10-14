import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { litres } from "../lib/meals";
import { foodActions } from "../store/food-store";

export type WaterSheetProps = {
	visible: boolean;
	day: string;
	ml: number;
	goalMl: number;
	onClose: () => void;
};

const STEPS = [-250, 250, 500] as const;

/** Change today's water: remove a glass, add one or two, or start the day over. */
export function WaterSheet({ visible, day, ml, goalMl, onClose }: WaterSheetProps) {
	return (
		<Sheet
			visible={visible}
			title="Water"
			onClose={onClose}
			action={{ label: "Done", onPress: onClose }}
		>
			<View style={styles.total}>
				<PoText variant="display36">{litres(ml)} L</PoText>
				<PoText variant="meta13" tone="textSecondary">
					of {litres(goalMl)} L today · {ml} ml
				</PoText>
			</View>
			<View style={styles.row}>
				{STEPS.map((step) => (
					<PillButton
						key={step}
						variant="secondary"
						label={step < 0 ? `−${-step} ml` : `+${step} ml`}
						disabled={step < 0 && ml <= 0}
						onPress={() => foodActions.addWater(day, step)}
						style={styles.step}
					/>
				))}
			</View>
			<PillButton
				variant="ghost"
				label="Reset today"
				disabled={ml <= 0}
				onPress={() => {
					haptics.select();
					foodActions.setWater(day, 0);
				}}
			/>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	total: { alignItems: "center", gap: 4, paddingVertical: 8 },
	row: { flexDirection: "row", gap: 8 },
	step: { flex: 1, paddingHorizontal: 8 },
});
