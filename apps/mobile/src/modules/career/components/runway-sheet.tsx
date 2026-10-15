import { useState } from "react";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { formatMoney, parseAmount } from "@/lib/money";
import { saveSettings } from "../data/career-actions";
import type { CareerSettings } from "../lib/career-model";

export type RunwaySheetProps = {
	visible: boolean;
	settings: CareerSettings;
	/** What Finance shows spent so far this month, for the cost estimate. */
	spentThisMonth: number;
	onClose: () => void;
};

/** Cash on hand, monthly costs and the weekly application target behind the Career hero. */
export function RunwaySheet({ visible, settings, spentThisMonth, onClose }: RunwaySheetProps) {
	const [cash, setCash] = useState(settings.cashOnHand ? String(settings.cashOnHand) : "");
	const [costs, setCosts] = useState(settings.monthlyCosts ? String(settings.monthlyCosts) : "");
	const [target, setTarget] = useState(String(settings.weeklyTarget));
	const [error, setError] = useState<string | null>(null);

	const save = async () => {
		const cashValue = cash.trim() ? parseAmount(cash) : null;
		const costValue = costs.trim() ? parseAmount(costs) : null;
		const targetValue = Number.parseInt(target, 10);
		if ((cash.trim() && cashValue === null) || (costs.trim() && costValue === null)) {
			setError("Amounts are numbers, like 300000.");
			return;
		}
		if (!Number.isFinite(targetValue) || targetValue < 1 || targetValue > 50) {
			setError("The weekly target is between 1 and 50.");
			return;
		}
		try {
			await saveSettings({
				id: "settings",
				cashOnHand: cashValue,
				monthlyCosts: costValue,
				weeklyTarget: targetValue,
			});
			onClose();
		} catch (caught) {
			console.error("[career] could not save settings", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<Sheet
			visible={visible}
			title="Runway"
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<PoText variant="body15" tone="textSecondary">
				How long your money lasts while you look. It stays on your phone and in your backup.
			</PoText>
			<TextField
				label="Cash for the job hunt"
				value={cash}
				onChangeText={setCash}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Monthly costs"
				value={costs}
				onChangeText={setCosts}
				keyboardType="numeric"
				suffix="Rs"
				placeholder={spentThisMonth > 0 ? "From Finance" : "e.g. 90000"}
			/>
			{!costs.trim() && spentThisMonth > 0 ? (
				<PoText variant="meta13" tone="textTertiary">
					Left empty, it's estimated from the {formatMoney(spentThisMonth)} Finance shows this
					month.
				</PoText>
			) : null}
			<TextField
				label="Applications a week"
				value={target}
				onChangeText={setTarget}
				keyboardType="number-pad"
			/>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}
