import { useEffect, useState } from "react";
import { PoText } from "@/components/ui/po-text";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { logReading } from "../data/health-actions";
import { inRange, READING_UNITS, type ReadingKind, type SugarContext } from "../lib/health-model";

const KINDS: { value: ReadingKind; label: string }[] = [
	{ value: "bp", label: "Blood pressure" },
	{ value: "heart-rate", label: "Heart rate" },
	{ value: "blood-sugar", label: "Blood sugar" },
	{ value: "spo2", label: "Oxygen" },
	{ value: "temperature", label: "Temperature" },
	{ value: "weight", label: "Weight" },
];

const CONTEXTS: { value: SugarContext; label: string }[] = [
	{ value: "fasting", label: "Fasting" },
	{ value: "after-meal", label: "After a meal" },
	{ value: "random", label: "Any time" },
];

const number = (text: string) => {
	const value = Number(text.replace(",", "."));
	return text.trim() && Number.isFinite(value) ? value : null;
};

/** Log one reading by hand: pick what it is, type the number, save. */
export function LogReadingSheet({
	visible,
	initialKind = "bp",
	onClose,
	onSaved,
}: {
	visible: boolean;
	initialKind?: ReadingKind;
	onClose: () => void;
	onSaved?: (kind: ReadingKind) => void;
}) {
	const [kind, setKind] = useState<ReadingKind>(initialKind);
	const [value, setValue] = useState("");
	const [value2, setValue2] = useState("");
	const [context, setContext] = useState<SugarContext>("random");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setKind(initialKind);
		setValue("");
		setValue2("");
		setError(null);
	}, [visible, initialKind]);

	const save = async () => {
		const first = number(value);
		const second = number(value2);
		if (first === null || !inRange(kind, first)) {
			setError("That number doesn't look right. Check it and try again.");
			return;
		}
		if (kind === "bp" && (second === null || second < 30 || second >= first)) {
			setError("Add both numbers: the top one is bigger, like 120 and 80.");
			return;
		}
		try {
			await logReading({ kind, value: first, value2: second, context });
			haptics.success();
			onSaved?.(kind);
			onClose();
		} catch (caught) {
			console.error("[health] could not save the reading", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<Sheet
			visible={visible}
			title="Add a reading"
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<ChoiceChips options={KINDS} value={kind} onChange={setKind} />
			{kind === "bp" ? (
				<>
					<TextField
						label="Top number (systolic)"
						value={value}
						onChangeText={setValue}
						keyboardType="number-pad"
						suffix="mmHg"
						placeholder="120"
					/>
					<TextField
						label="Bottom number (diastolic)"
						value={value2}
						onChangeText={setValue2}
						keyboardType="number-pad"
						suffix="mmHg"
						placeholder="80"
					/>
				</>
			) : (
				<TextField
					label={KINDS.find((item) => item.value === kind)?.label ?? "Value"}
					value={value}
					onChangeText={setValue}
					keyboardType="decimal-pad"
					suffix={READING_UNITS[kind]}
					onSubmitEditing={() => void save()}
				/>
			)}
			{kind === "blood-sugar" ? (
				<ChoiceChips label="When" options={CONTEXTS} value={context} onChange={setContext} />
			) : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}
