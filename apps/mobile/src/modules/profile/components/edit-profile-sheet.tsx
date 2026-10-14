import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { type UnitSystem, unitsFor, unitSystem } from "../lib/labels";

type EditProfileSheetProps = { visible: boolean; onClose: () => void };

const unitOptions = [
	{ value: "metric", label: "cm · kg" },
	{ value: "imperial", label: "ft · lb" },
] as const;

/** Header "Edit": name and units, saved with the onboarding answers. */
export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
	const savedName = useOnboardingStore((state) => state.name);
	const heightUnit = useOnboardingStore((state) => state.heightUnit);
	const weightUnit = useOnboardingStore((state) => state.weightUnit);
	const [name, setName] = useState(savedName);
	const [units, setUnits] = useState<UnitSystem>(unitSystem(heightUnit, weightUnit));

	useEffect(() => {
		if (!visible) return;
		setName(savedName);
		setUnits(unitSystem(heightUnit, weightUnit));
	}, [visible, savedName, heightUnit, weightUnit]);

	const save = () => {
		if (!name.trim()) return;
		const store = useOnboardingStore.getState();
		const next = unitsFor(units);
		store.set("name", name.trim());
		store.set("heightUnit", next.heightUnit);
		store.set("weightUnit", next.weightUnit);
		useOnboardingProgress
			.getState()
			.persistAnswers()
			.catch((error: unknown) => console.error("Could not save the profile", error));
		haptics.success();
		onClose();
	};

	return (
		<Sheet
			visible={visible}
			title="Edit profile"
			onClose={onClose}
			action={{ label: "Save", onPress: save, disabled: name.trim().length === 0 }}
		>
			<TextField
				label="Name"
				value={name}
				onChangeText={setName}
				placeholder="Your name"
				onSubmitEditing={save}
			/>
			<View style={styles.group}>
				<PoText variant="meta13" tone="textSecondary">
					Units
				</PoText>
				<SegmentedControl
					options={unitOptions}
					value={units}
					onChange={setUnits}
					accessibilityLabel="Units"
				/>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	group: { gap: 8 },
});
