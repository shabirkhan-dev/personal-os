import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { RoutineKind, Step } from "../lib/skincare-types";

export type EditRoutineSheetProps = {
	visible: boolean;
	kind: RoutineKind;
	steps: readonly Step[];
	onClose: () => void;
	onSave: (steps: Step[]) => void;
};

/** Rename, add or remove the steps of one routine. Steps keep their ids, so ticks survive. */
export function EditRoutineSheet({ visible, kind, steps, onClose, onSave }: EditRoutineSheetProps) {
	const [draft, setDraft] = useState<Step[]>([]);

	useEffect(() => {
		if (visible) setDraft(steps.map((step) => ({ ...step })));
	}, [visible, steps]);

	const change = (id: string, patch: Partial<Step>) =>
		setDraft((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));

	const save = () =>
		onSave(
			draft
				.map((step) => ({ ...step, name: step.name.trim(), detail: step.detail.trim() }))
				.filter((step) => step.name.length > 0),
		);

	return (
		<Sheet
			visible={visible}
			title={kind === "morning" ? "Morning routine" : "Night routine"}
			onClose={onClose}
			action={{ label: "Save routine", onPress: save }}
		>
			{draft.length === 0 ? (
				<PoText variant="meta13" tone="textTertiary">
					No steps yet. Add the first one below.
				</PoText>
			) : null}
			{draft.map((step, index) => (
				<StepEditor
					key={step.id}
					index={index}
					step={step}
					onChange={(patch) => change(step.id, patch)}
					onRemove={() => setDraft((current) => current.filter((s) => s.id !== step.id))}
				/>
			))}
			<PillButton
				label="Add step"
				variant="secondary"
				showPlus
				onPress={() => setDraft((current) => [...current, { id: newId(), name: "", detail: "" }])}
			/>
		</Sheet>
	);
}

type StepEditorProps = {
	index: number;
	step: Step;
	onChange: (patch: Partial<Step>) => void;
	onRemove: () => void;
};

function StepEditor({ index, step, onChange, onRemove }: StepEditorProps) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.step, { borderColor: colors.borderDefault }]}>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="textTertiary">
					STEP {index + 1}
				</PoText>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Remove ${step.name || `step ${index + 1}`}`}
					hitSlop={10}
					onPress={() => {
						haptics.select();
						onRemove();
					}}
					style={styles.remove}
				>
					<Icon name="Line/Close" size={14} color={colors.textSecondary} />
					<PoText variant="meta13" tone="textSecondary">
						Remove
					</PoText>
				</Pressable>
			</View>
			<TextField
				label="Name"
				value={step.name}
				onChangeText={(name) => onChange({ name })}
				placeholder="Cleanser"
			/>
			<TextField
				label="Note"
				value={step.detail}
				onChangeText={(detail) => onChange({ detail })}
				placeholder="2 pumps · let it dry"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	step: { gap: 10, paddingBottom: 14, borderBottomWidth: 1 },
	head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	remove: { flexDirection: "row", alignItems: "center", gap: 4 },
});
