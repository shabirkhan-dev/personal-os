import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { usePoTheme } from "@/theme";
import { parseAmount } from "@/lib/money";
import { CATEGORY_LABELS, EXPENSE_CATEGORIES, type ExpenseCategory } from "../lib/finance-model";
import { deleteReceiptPhoto } from "../services/receipt-photo";
import type { NewExpense } from "../store/finance-store";

export type ExpenseDraft = {
	amount: string;
	category: ExpenseCategory;
	note: string;
	receiptUri?: string;
	/** A line above the form, e.g. why the camera did not open. */
	notice?: string;
};

export const emptyExpenseDraft: ExpenseDraft = { amount: "", category: "other", note: "" };

const categoryOptions = EXPENSE_CATEGORIES.map((value) => ({
	value,
	label: CATEGORY_LABELS[value],
}));

export type AddExpenseSheetProps = {
	visible: boolean;
	/** Remount the sheet (change its `key`) to start from a new draft. */
	draft: ExpenseDraft;
	onClose: () => void;
	onSave: (expense: NewExpense) => void;
};

/** Add expense: amount, category and note, with the receipt photo when one was scanned. */
export function AddExpenseSheet({ visible, draft, onClose, onSave }: AddExpenseSheetProps) {
	const { colors } = usePoTheme();
	const [amount, setAmount] = useState(draft.amount);
	const [category, setCategory] = useState<ExpenseCategory>(draft.category);
	const [note, setNote] = useState(draft.note);
	const [receiptUri, setReceiptUri] = useState(draft.receiptUri);
	const value = parseAmount(amount);

	const discardPhoto = () => {
		if (receiptUri) deleteReceiptPhoto(receiptUri);
		setReceiptUri(undefined);
	};

	const save = () => {
		if (value === null) return;
		onSave({ amount: value, category, note, ...(receiptUri ? { receiptUri } : {}) });
	};

	return (
		<Sheet
			visible={visible}
			title="Add expense"
			onClose={() => {
				discardPhoto();
				onClose();
			}}
			action={{ label: "Add expense", onPress: save, disabled: value === null }}
		>
			{draft.notice ? (
				<PoText variant="meta13" tone="textWarning">
					{draft.notice}
				</PoText>
			) : null}
			{receiptUri ? (
				<View style={[styles.receipt, { backgroundColor: colors.bgSubtle }]}>
					<Image
						source={{ uri: receiptUri }}
						style={styles.photo}
						accessibilityLabel="Receipt photo"
					/>
					<View style={styles.receiptText}>
						<PoText variant="row15">Receipt attached</PoText>
						<PoText variant="meta13" tone="textSecondary">
							Reading the total from a receipt automatically is coming soon. Type the amount for
							now.
						</PoText>
					</View>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Remove receipt photo"
						hitSlop={10}
						onPress={discardPhoto}
						style={[styles.remove, { backgroundColor: colors.bgSurface }]}
					>
						<Icon name="Line/Close" size={14} color={colors.textSecondary} />
					</Pressable>
				</View>
			) : null}
			<TextField
				label="Amount"
				value={amount}
				onChangeText={setAmount}
				placeholder="0"
				keyboardType="decimal-pad"
				suffix="Rs"
				onSubmitEditing={save}
			/>
			<ChoiceChips
				label="Category"
				options={categoryOptions}
				value={category}
				onChange={setCategory}
			/>
			<TextField label="Note" value={note} onChangeText={setNote} placeholder="Lunch, Uber…" />
		</Sheet>
	);
}

const styles = StyleSheet.create({
	receipt: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 10,
		borderRadius: 16,
	},
	photo: { width: 56, height: 72, borderRadius: 10 },
	receiptText: { flex: 1, gap: 2 },
	remove: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "flex-start",
	},
});
