import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { formatMoney, parseAmount } from "@/lib/money";

export type SavingsSheetProps = {
	visible: boolean;
	/** Current target; null when there is no goal yet. */
	target: number | null;
	saved: number;
	/** Typed in the ask bar ("saved 2000"). */
	initialAdd?: string;
	onClose: () => void;
	onSetTarget: (target: number) => void;
	onAdd: (amount: number) => void;
	onRemove: () => void;
};

/** Savings goal: set the target, or add money to what is saved. */
export function SavingsSheet({
	visible,
	target,
	saved,
	initialAdd,
	onClose,
	onSetTarget,
	onAdd,
	onRemove,
}: SavingsSheetProps) {
	const [add, setAdd] = useState(initialAdd ?? "");
	const [targetText, setTargetText] = useState(target ? String(target) : "");
	const addValue = parseAmount(add);
	const targetValue = parseAmount(targetText);

	if (target === null) {
		return (
			<Sheet
				visible={visible}
				title="Savings goal"
				onClose={onClose}
				action={{
					label: "Set goal",
					onPress: () => targetValue !== null && onSetTarget(targetValue),
					disabled: targetValue === null,
				}}
			>
				<TextField
					label="What are you saving towards?"
					value={targetText}
					onChangeText={setTargetText}
					placeholder="30,000"
					keyboardType="decimal-pad"
					suffix="Rs"
				/>
				<PoText variant="meta13" tone="textSecondary">
					Add money to it whenever you put some aside; progress and the change vs last month come
					from what you add.
				</PoText>
			</Sheet>
		);
	}

	return (
		<Sheet
			visible={visible}
			title="Savings goal"
			onClose={onClose}
			action={{
				label: "Add to savings",
				onPress: () => addValue !== null && onAdd(addValue),
				disabled: addValue === null,
			}}
		>
			<PoText variant="meta13" tone="textSecondary">
				{`${formatMoney(saved)} saved of ${formatMoney(target)}.`}
			</PoText>
			<TextField
				label="Add money"
				value={add}
				onChangeText={setAdd}
				placeholder="1,000"
				keyboardType="decimal-pad"
				suffix="Rs"
			/>
			<TextField
				label="Target"
				value={targetText}
				onChangeText={setTargetText}
				keyboardType="decimal-pad"
				suffix="Rs"
			/>
			<PillButton
				label="Update target"
				variant="secondary"
				disabled={targetValue === null || targetValue === target}
				onPress={() => targetValue !== null && onSetTarget(targetValue)}
			/>
			<PillButton label="Remove goal" variant="ghost" onPress={onRemove} />
		</Sheet>
	);
}
