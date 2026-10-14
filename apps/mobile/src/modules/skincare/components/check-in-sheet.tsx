import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { CheckIn, Hydration, Redness } from "../lib/skincare-types";

export type CheckInDraft = Pick<CheckIn, "hydration" | "redness" | "breakouts" | "photoUri">;

export type CheckInSheetProps = {
	visible: boolean;
	/** Today's saved check-in (or the last one) to start from. */
	initial: CheckInDraft | null;
	/** A photo just taken for this check-in. */
	photoUri?: string;
	onClose: () => void;
	onSave: (draft: CheckInDraft) => void;
};

const HYDRATION = [
	{ value: "good", label: "Good" },
	{ value: "ok", label: "Ok" },
	{ value: "low", label: "Low" },
] as const;
const REDNESS = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
] as const;

/** Today's skin check: hydration, redness, new breakouts, and the photo when one was taken. */
export function CheckInSheet({ visible, initial, photoUri, onClose, onSave }: CheckInSheetProps) {
	const { colors } = usePoTheme();
	const [hydration, setHydration] = useState<Hydration | null>(null);
	const [redness, setRedness] = useState<Redness | null>(null);
	const [breakouts, setBreakouts] = useState(0);
	const [wasVisible, setWasVisible] = useState(false);
	const photo = photoUri ?? initial?.photoUri;

	// Start from the saved values each time the sheet opens.
	if (visible !== wasVisible) {
		setWasVisible(visible);
		if (visible) {
			setHydration(initial?.hydration ?? null);
			setRedness(initial?.redness ?? null);
			setBreakouts(initial?.breakouts ?? 0);
		}
	}

	const step = (delta: number) => {
		haptics.select();
		setBreakouts((count) => Math.max(0, Math.min(99, count + delta)));
	};

	return (
		<Sheet
			visible={visible}
			title="How is your skin today?"
			onClose={onClose}
			action={{
				label: "Save check-in",
				disabled: !hydration || !redness,
				onPress: () => {
					if (!hydration || !redness) return;
					onSave({ hydration, redness, breakouts, ...(photo ? { photoUri: photo } : {}) });
				},
			}}
		>
			{photo ? (
				<Image
					source={{ uri: photo }}
					accessibilityLabel="Today's skin photo"
					style={[styles.photo, { backgroundColor: colors.bgSubtle }]}
				/>
			) : null}
			<ChoiceChips
				label="Hydration"
				options={HYDRATION}
				value={hydration}
				onChange={setHydration}
			/>
			<ChoiceChips label="Redness" options={REDNESS} value={redness} onChange={setRedness} />
			<View style={styles.group}>
				<PoText variant="meta13" tone="textSecondary">
					New breakouts
				</PoText>
				<View style={styles.stepper}>
					<StepButton icon="Minus" label="One fewer" onPress={() => step(-1)} />
					<PoText variant="title18" style={styles.count}>
						{breakouts}
					</PoText>
					<StepButton icon="Line/Plus" label="One more" onPress={() => step(1)} />
				</View>
			</View>
		</Sheet>
	);
}

type StepButtonProps = { icon: "Minus" | "Line/Plus"; label: string; onPress: () => void };

function StepButton({ icon, label, onPress }: StepButtonProps) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			style={[
				styles.stepButton,
				{ backgroundColor: colors.bgSubtle, borderColor: colors.borderDefault },
			]}
		>
			<Icon name={icon} size={16} color={colors.textPrimary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	photo: { width: "100%", aspectRatio: 1, borderRadius: 20 },
	group: { gap: 6 },
	stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
	count: { minWidth: 32, textAlign: "center" },
	stepButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
