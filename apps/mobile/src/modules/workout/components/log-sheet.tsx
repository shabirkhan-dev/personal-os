import { useEffect, useState } from "react";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { estimateKcal } from "../lib/kcal";
import { formatKm } from "../lib/parse-log";
import { typeLabel, type WorkoutType } from "../lib/types";
import { addSession } from "../store/workout-store";
import { readNumber, typeOptions } from "./fields";

export type LogDraft = { type: WorkoutType; distanceKm?: number; durationMin?: number | null };

export type LogSheetProps = { visible: boolean; draft: LogDraft; onClose: () => void };

/** Quick log of a finished workout (a run by default): distance, minutes, calories. */
export function LogSheet({ visible, draft, onClose }: LogSheetProps) {
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const [type, setType] = useState<WorkoutType>(draft.type);
	const [distanceText, setDistanceText] = useState("");
	const [minutesText, setMinutesText] = useState("");
	const [kcalText, setKcalText] = useState("");

	useEffect(() => {
		if (!visible) return;
		setType(draft.type);
		setDistanceText(draft.distanceKm ? formatKm(draft.distanceKm) : "");
		setMinutesText(draft.durationMin ? String(draft.durationMin) : "");
		setKcalText("");
	}, [visible, draft]);

	const distance = readNumber(distanceText) ?? undefined;
	const minutes = readNumber(minutesText);
	const estimate = minutes ? estimateKcal(type, minutes, weightKg, distance) : 0;

	const save = () => {
		if (!minutes) return;
		const startedAt = new Date(Date.now() - minutes * 60000);
		addSession({
			type,
			title: distance ? `${typeLabel[type]} · ${formatKm(distance)} km` : typeLabel[type],
			startedAt: startedAt.toISOString(),
			durationMin: Math.round(minutes),
			...(distance ? { distanceKm: distance } : {}),
			kcal: Math.round(readNumber(kcalText) ?? estimate),
			feel: null,
		});
		haptics.success();
		onClose();
	};

	return (
		<Sheet
			visible={visible}
			title={type === "run" ? "Log a run" : `Log ${typeLabel[type].toLowerCase()}`}
			onClose={onClose}
			action={{ label: "Save", onPress: save, disabled: !minutes }}
		>
			<ChoiceChips label="Type" options={typeOptions} value={type} onChange={setType} />
			<TextField
				label="Distance"
				value={distanceText}
				onChangeText={setDistanceText}
				keyboardType="decimal-pad"
				placeholder="Optional"
				suffix="km"
			/>
			<TextField
				label="Minutes"
				value={minutesText}
				onChangeText={setMinutesText}
				keyboardType="number-pad"
				suffix="min"
			/>
			<TextField
				label="Calories"
				value={kcalText}
				onChangeText={setKcalText}
				keyboardType="number-pad"
				placeholder={minutes ? `${estimate} (estimate)` : "Estimated from minutes"}
				suffix="kcal"
			/>
		</Sheet>
	);
}
