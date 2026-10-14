import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { PoText } from "@/components/ui/po-text";

export type ProductDraft = { name: string; startedAt: string; lastsWeeks: number };

export type ProductSheetProps = {
	visible: boolean;
	/** Prefilled name, e.g. from "add niacinamide serum". */
	initialName: string;
	onClose: () => void;
	onSave: (draft: ProductDraft) => void;
};

/** A real calendar day typed as YYYY-MM-DD, not in the future. */
function validDay(value: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (!match) return false;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return dayKey(date) === value.trim() && date.getTime() <= Date.now();
}

/** Add a product: name, the day it was opened (today by default) and how long one lasts. */
export function ProductSheet({ visible, initialName, onClose, onSave }: ProductSheetProps) {
	const [name, setName] = useState("");
	const [startedAt, setStartedAt] = useState(dayKey());
	const [weeks, setWeeks] = useState("8");

	useEffect(() => {
		if (!visible) return;
		setName(initialName);
		setStartedAt(dayKey());
		setWeeks("8");
	}, [visible, initialName]);

	const lastsWeeks = Number(weeks);
	const weeksOk = Number.isFinite(lastsWeeks) && lastsWeeks >= 1 && lastsWeeks <= 104;
	const dayOk = validDay(startedAt);
	const canSave = name.trim().length > 0 && weeksOk && dayOk;

	const save = () => {
		if (!canSave) return;
		onSave({ name: name.trim(), startedAt: startedAt.trim(), lastsWeeks: Math.round(lastsWeeks) });
	};

	return (
		<Sheet
			visible={visible}
			title="Add product"
			onClose={onClose}
			action={{ label: "Add product", disabled: !canSave, onPress: save }}
		>
			<TextField label="Name" value={name} onChangeText={setName} placeholder="Sunscreen SPF 50" />
			<TextField
				label="Opened on"
				value={startedAt}
				onChangeText={setStartedAt}
				placeholder="YYYY-MM-DD"
				keyboardType="numbers-and-punctuation"
			/>
			{!dayOk && startedAt.length > 0 ? (
				<PoText variant="meta13" tone="textDanger">
					Use a past date like {dayKey()}.
				</PoText>
			) : null}
			<TextField
				label="One bottle lasts"
				value={weeks}
				onChangeText={setWeeks}
				keyboardType="number-pad"
				suffix="weeks"
				onSubmitEditing={save}
			/>
		</Sheet>
	);
}
