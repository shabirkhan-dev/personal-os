import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { saveSettings } from "../data/finance-actions";
import { byCategory, inMonth, rupees } from "../lib/finance-math";
import {
	CATEGORIES,
	CATEGORY_LABELS,
	type Entry,
	type FinanceSettings,
} from "../lib/finance-model";
import { type BudgetDraftAi, financeAiMessage, useFinanceAi } from "../services/finance-ai";

/** What each line cost on average over the last three full months. */
function averageSpend(entries: readonly Entry[], now: Date): Record<string, number> {
	const months = [1, 2, 3].map((back) => byCategory(inMonth(entries, now, -back)));
	return Object.fromEntries(
		CATEGORIES.map((category) => [
			category,
			Math.round(months.reduce((sum, month) => sum + month[category], 0) / months.length),
		]),
	);
}

/**
 * Finance · Design a budget with AI: say what matters ("save 20k", "rent is 35k"), get limits per
 * line, the minimum that's always paid and a few tips, then use it or ask again. Nothing is
 * saved until "Use this budget".
 */
export function BudgetDesignSheet({
	visible,
	settings,
	entries,
	onClose,
}: {
	visible: boolean;
	settings: FinanceSettings;
	entries: readonly Entry[];
	onClose: () => void;
}) {
	const ai = useFinanceAi();
	const [notes, setNotes] = useState("");
	const [draft, setDraft] = useState<BudgetDraftAi | null>(null);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const design = () => {
		setBusy(true);
		setNotice(null);
		ai.designBudget({
			monthlyCost: settings.monthlyCost,
			monthlyIncome: settings.monthlyIncome,
			spent: averageSpend(entries, new Date()),
			notes,
		})
			.then(setDraft)
			.catch((error: unknown) => {
				console.warn("[finance] budget design failed", error);
				setNotice(financeAiMessage(error));
			})
			.finally(() => setBusy(false));
	};

	const use = (draftToUse: BudgetDraftAi) => {
		setBusy(true);
		saveSettings({
			...settings,
			limits: { ...settings.limits, ...draftToUse.limits },
			minimum: draftToUse.minimum.length ? draftToUse.minimum : settings.minimum,
		})
			.then(() => {
				haptics.success();
				setDraft(null);
				onClose();
			})
			.catch((error: unknown) => {
				console.error("[finance] could not save the budget", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
			.finally(() => setBusy(false));
	};

	const total = draft
		? CATEGORIES.reduce((sum, category) => sum + (draft.limits[category] ?? 0), 0)
		: 0;

	return (
		<Sheet visible={visible} title="Design a budget with AI" onClose={onClose}>
			{!ai.available ? (
				<PoText variant="meta13" tone="textSecondary">
					Sign in, or add your own AI key in Settings, to design a budget with AI. You can still set
					limits yourself or use the suggested split.
				</PoText>
			) : draft ? (
				<View style={styles.gap}>
					{draft.note ? (
						<PoText variant="meta13" tone="textSecondary">
							{draft.note}
						</PoText>
					) : null}
					<PoText variant="title18">{`${rupees(total)} a month`}</PoText>
					{CATEGORIES.filter((category) => (draft.limits[category] ?? 0) > 0).map((category) => (
						<View key={category} style={styles.line}>
							<PoText variant="row15" style={styles.flex}>
								{CATEGORY_LABELS[category]}
							</PoText>
							<PoText variant="mono13" tone="textSecondary">
								{rupees(draft.limits[category] ?? 0)}
							</PoText>
						</View>
					))}
					{draft.minimum.length > 0 ? (
						<PoText variant="meta13" tone="textSecondary">
							{`Always paid: ${draft.minimum.map((item) => `${item.label} ${rupees(item.amount)}`).join(", ")}`}
						</PoText>
					) : null}
					{draft.tips.map((tip) => (
						<PoText key={tip} variant="meta13" tone="textSecondary">
							{`• ${tip}`}
						</PoText>
					))}
					<PillButton
						label={busy ? "Saving…" : "Use this budget"}
						disabled={busy}
						onPress={() => use(draft)}
					/>
					<PillButton
						label="Ask again"
						variant="secondary"
						disabled={busy}
						onPress={() => setDraft(null)}
					/>
				</View>
			) : (
				<View style={styles.gap}>
					<PoText variant="meta13" tone="textSecondary">
						{`It starts from your ${rupees(settings.monthlyCost)} month and what you spent per line lately. Add anything that matters.`}
					</PoText>
					<TextField
						label="What should it plan for? (optional)"
						value={notes}
						onChangeText={setNotes}
						placeholder="Save 20k a month, rent is 35k, less eating out"
						multiline
					/>
					<PillButton
						label={busy ? "Designing…" : "Design my budget"}
						disabled={busy}
						onPress={design}
					/>
				</View>
			)}
			{notice ? (
				<PoText variant="meta13" tone="textWarning">
					{notice}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	gap: { gap: 12 },
	line: { flexDirection: "row", alignItems: "center", gap: 12 },
	flex: { flex: 1, minWidth: 0 },
});
