import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { clampLevel } from "../lib/energy";
import { addEnergy } from "../store/workout-store";

const PRESETS = ["20", "40", "60", "80", "100"] as const;
const presetOptions = PRESETS.map((value) => ({ value, label: value }));
const STEP = 5;

export type EnergySheetProps = { visible: boolean; initial: number; onClose: () => void };

/** Log energy: presets plus a ±5 stepper over 0–100. */
export function EnergySheet({ visible, initial, onClose }: EnergySheetProps) {
	const { colors } = usePoTheme();
	const [level, setLevel] = useState(initial);
	useEffect(() => {
		if (visible) setLevel(initial);
	}, [visible, initial]);

	const step = (delta: number) => {
		haptics.select();
		setLevel((value) => clampLevel(value + delta));
	};
	const preset = PRESETS.find((value) => Number(value) === level) ?? null;

	return (
		<Sheet
			visible={visible}
			title="Log energy"
			onClose={onClose}
			action={{
				label: "Log energy",
				onPress: () => {
					addEnergy(level);
					haptics.success();
					onClose();
				},
			}}
		>
			<View style={styles.stepper}>
				<StepButton
					icon="Minus"
					label="Less energy"
					onPress={() => step(-STEP)}
					disabled={level <= 0}
				/>
				<View style={styles.value} accessibilityLiveRegion="polite">
					<PoText variant="hero40">{String(level)}</PoText>
					<PoText variant="meta13" tone="textTertiary">
						of 100
					</PoText>
				</View>
				<StepButton
					icon="Line/Plus"
					label="More energy"
					onPress={() => step(STEP)}
					disabled={level >= 100}
				/>
			</View>
			<ChoiceChips
				label="Quick pick"
				options={presetOptions}
				value={preset}
				onChange={(value) => setLevel(Number(value))}
			/>
			<View style={[styles.hint, { borderColor: colors.borderDefault }]}>
				<PoText variant="meta13" tone="textSecondary">
					0 is drained, 100 is the best you feel.
				</PoText>
			</View>
		</Sheet>
	);
}

type StepButtonProps = {
	icon: "Minus" | "Line/Plus";
	label: string;
	onPress: () => void;
	disabled: boolean;
};

function StepButton({ icon, label, onPress, disabled }: StepButtonProps) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={[styles.step, { backgroundColor: colors.bgSubtle, opacity: disabled ? 0.45 : 1 }]}
		>
			<Icon name={icon} color={colors.textPrimary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	value: { alignItems: "center" },
	step: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
	hint: { borderTopWidth: 1, paddingTop: 12 },
});
