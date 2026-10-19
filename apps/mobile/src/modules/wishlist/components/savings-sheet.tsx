import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { financeRoutes } from "@/modules/finance";
import { useDreamSavings } from "../hooks/use-dream-savings";
import { amountLeft, compactMoney, fullMoney } from "../lib/wishlist-math";
import type { Dream } from "../lib/wishlist-model";

/**
 * "Add savings": an amount and the Finance budget line it comes from. Saving moves it from that
 * line into Dreams in Finance (a category transfer) and adds it to this dream.
 */
export function SavingsSheet({
	dream,
	visible,
	onClose,
	onSaved,
}: {
	dream: Dream;
	visible: boolean;
	onClose: () => void;
	onSaved: (message: string) => void;
}) {
	const savings = useDreamSavings();
	const [amount, setAmount] = useState("");
	const [from, setFrom] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!visible) return;
		setAmount("");
		setError(null);
		setFrom(savings.lines[0]?.category ?? null);
		// oxlint-disable-next-line react/exhaustive-deps -- reset each time it opens
	}, [visible]);

	const line = savings.lines.find((item) => item.category === from) ?? null;
	const value = parseAmount(amount);
	const left = amountLeft(dream);
	const tooMuch = value !== null && line !== null && value > line.room;

	const save = async () => {
		if (value === null || !line) return;
		setBusy(true);
		setError(null);
		try {
			await savings.add(dream, value, line.category);
			haptics.success();
			onSaved(`${fullMoney(value)} moved from ${line.label} to Dreams for ${dream.name}.`);
			onClose();
		} catch (failure) {
			console.error("[wishlist] could not add savings", failure);
			setError(
				failure instanceof Error && failure.message
					? failure.message
					: "Couldn't save on this phone. Try again.",
			);
		} finally {
			setBusy(false);
		}
	};

	if (!savings.ready) {
		return (
			<Sheet visible={visible} title="Add savings" onClose={onClose}>
				<PoText variant="body15" tone="textSecondary">
					Savings come out of your Finance budget, so set up Finance first: money on hand and what a
					month costs. Then pick which budget line the money comes from.
				</PoText>
				<PillButton
					label="Open Finance"
					onPress={() => {
						onClose();
						financeRoutes.runway();
					}}
				/>
			</Sheet>
		);
	}

	return (
		<Sheet
			visible={visible}
			title={`Save for ${dream.name}`}
			onClose={onClose}
			action={{
				label: busy ? "Saving…" : value ? `Move ${compactMoney(value)}` : "Add savings",
				onPress: () => void save(),
				disabled: busy || value === null || !line || tooMuch,
			}}
		>
			<TextField
				label={left > 0 ? `Amount · ${compactMoney(left)} still to go` : "Amount"}
				value={amount}
				onChangeText={setAmount}
				keyboardType="decimal-pad"
				suffix="Rs"
				placeholder="5,000"
			/>
			{savings.lines.length === 0 ? (
				<PoText variant="meta13" tone="textWarning">
					Every budget line is used up this month. Move money between lines in Finance, or wait for
					next month.
				</PoText>
			) : (
				<View style={styles.group}>
					<PoText variant="meta13" tone="textSecondary">
						From budget line
					</PoText>
					<View style={styles.chips}>
						{savings.lines.map((item) => (
							<FilterChip
								key={item.category}
								label={`${item.label} · ${compactMoney(item.room)}`}
								selected={from === item.category}
								onPress={() => setFrom(item.category)}
							/>
						))}
					</View>
				</View>
			)}
			<PoText variant="meta13" tone={tooMuch ? "textDanger" : "textTertiary"}>
				{tooMuch && line
					? `${line.label} has ${fullMoney(line.room)} left this month.`
					: line
						? `Moves it from ${line.label} to the Dreams line in Finance and out of money now, like cash put in an envelope. Undo puts it back.`
						: ""}
			</PoText>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	group: { gap: 6 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
