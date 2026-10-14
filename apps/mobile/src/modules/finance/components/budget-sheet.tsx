import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { formatMoney, parseAmount } from "@/lib/money";
import { dailyBudget } from "../lib/finance-math";

export type BudgetSheetProps = {
	visible: boolean;
	budget: number | null;
	/** Typed in the ask bar ("budget 60000"). */
	initialAmount?: string;
	onClose: () => void;
	onSave: (budget: number | null) => void;
};

/** Set budget: one monthly amount; the daily budget is that spread over the month. */
export function BudgetSheet({ visible, budget, initialAmount, onClose, onSave }: BudgetSheetProps) {
	const [amount, setAmount] = useState(initialAmount ?? (budget ? String(budget) : ""));
	const value = parseAmount(amount);
	const [today] = useState(() => new Date());
	const perDay = dailyBudget(value, today);

	return (
		<Sheet
			visible={visible}
			title="Monthly budget"
			onClose={onClose}
			action={{
				label: "Save budget",
				onPress: () => value !== null && onSave(value),
				disabled: value === null,
			}}
		>
			<TextField
				label="How much can you spend this month?"
				value={amount}
				onChangeText={setAmount}
				placeholder="60,000"
				keyboardType="decimal-pad"
				suffix="Rs"
			/>
			<PoText variant="meta13" tone="textSecondary">
				{perDay !== null
					? `About ${formatMoney(Math.round(perDay))} a day this month.`
					: "Today's spending is compared with this spread over the month."}
			</PoText>
			{budget !== null ? (
				<PillButton label="Remove budget" variant="ghost" onPress={() => onSave(null)} />
			) : null}
		</Sheet>
	);
}
