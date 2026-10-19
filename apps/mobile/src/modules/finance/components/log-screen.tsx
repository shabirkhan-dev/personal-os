import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { FilterChip, ListRow, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatMoney, parseAmount } from "@/lib/money";
import { useGroceryMatch } from "@/modules/food";
import { toTextStyle, usePoTheme } from "@/theme";
import { logSpend } from "../data/finance-actions";
import { FINANCE_READ_JOB, useFinanceUi } from "../hooks/finance-ui-store";
import { useFinanceToday } from "../hooks/use-finance";
import { rupees, total } from "../lib/finance-math";
import {
	SPEND_CATEGORIES,
	type Category,
	CATEGORY_LABELS,
	CATEGORY_SHORT,
	METHOD_LABELS,
	METHODS,
	type Method,
} from "../lib/finance-model";
import { parseFinanceLine, type SpendItem } from "../lib/parse-finance-line";
import { financeAiMessage, useFinanceAi } from "../services/finance-ai";
import { ButtonPair, Card, CardHead, Eyebrow } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";

const inputStyle = toTextStyle(textStyles.body15);
const NEW_ITEM: SpendItem = { name: "", amount: 0, category: "other" };
const READ_STEPS = ["Reading what you spent", "Splitting it into items"] as const;

/** Finance · Log spending: type or say it, the phone splits it into items, then save. */
export function LogScreen() {
	const { colors } = usePoTheme();
	const { data, now, sums } = useFinanceToday();
	const draft = useFinanceUi((state) => state.draft);
	const ai = useFinanceAi();
	const readJob = useAiJobs((state) => state.jobs[FINANCE_READ_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [text, setText] = useState(draft?.text ?? "");
	const [items, setItems] = useState<SpendItem[]>(draft?.items ?? []);
	const [method, setMethod] = useState<Method>(draft?.method ?? "cash");
	const [edited, setEdited] = useState(false);
	const [editing, setEditing] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const receiptUri = draft?.receiptUri ?? null;
	const names = useMemo(() => items.map((item) => item.name), [items]);
	const groceries = useGroceryMatch(names);
	const editingItem = useMemo(
		() => (editing === null ? null : (items[editing] ?? NEW_ITEM)),
		[editing, items],
	);

	useEffect(() => () => useFinanceUi.getState().setDraft(null), []);

	const onText = (value: string) => {
		setText(value);
		if (edited) return;
		const intent = parseFinanceLine(value);
		if (intent?.kind === "spend") {
			setItems(intent.items);
			if (intent.method) setMethod(intent.method);
		} else setItems([]);
	};

	const readWithAi = () => {
		startJob(FINANCE_READ_JOB, "Reading what you spent", async () => {
			try {
				const reading = await ai.read(text);
				if (reading.items.length === 0) throw new Error("empty");
				setItems(reading.items);
				if (reading.method) setMethod(reading.method);
				setEdited(true);
			} catch (error) {
				throw new Error(
					error instanceof Error && error.message === "empty"
						? "Couldn't find amounts in that. Add them like “fuel 1500”."
						: financeAiMessage(error),
					{ cause: error },
				);
			}
		});
	};

	const sum = total(items);
	const main = [...items].sort((a, b) => b.amount - a.amount)[0]?.category ?? null;
	const mainLeft = main
		? data.settings.limits[main] -
			sums[main] -
			total(items.filter((item) => item.category === main))
		: 0;
	const matched = groceries.ids.length;

	const save = () => {
		if (items.length === 0) {
			setNotice("Add an amount, like “fuel 1500”.");
			return;
		}
		setSaving(true);
		logSpend(items, method, { receiptUri })
			.then(() => groceries.tick())
			.then(() => {
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[finance] could not save spending", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
			.finally(() => setSaving(false));
	};

	return (
		<FinanceScreen>
			<ScreenTitle
				eyebrow={`Today · ${clock(now)} · ${receiptUri ? "receipt attached" : "AI splits it"}`}
				title="What did you spend?"
			/>
			<View
				style={[
					styles.input,
					{ backgroundColor: colors.bgSurface, borderColor: colors.accentDefault },
				]}
			>
				<TextInput
					value={text}
					onChangeText={onText}
					placeholder={
						receiptUri
							? "What's on the receipt? “groceries 2400, cash”"
							: "chicken 1 kg 800 and milk 4 litre 880, cash"
					}
					placeholderTextColor={colors.textTertiary}
					selectionColor={colors.accentDefault}
					multiline
					accessibilityLabel="What did you spend"
					style={[inputStyle, styles.text, { color: colors.textPrimary }]}
				/>
				{matched > 0 ? (
					<View style={styles.matchRow}>
						<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
						<PoText variant="meta13" tone="textSecondary">
							{`Matched ${matched} ${matched === 1 ? "item" : "items"} on your grocery list`}
						</PoText>
					</View>
				) : null}
				{text.trim() && items.length === 0 && ai.available && !readJob ? (
					<PillButton label="Split it with AI" variant="secondary" onPress={readWithAi} />
				) : null}
			</View>
			{readJob ? (
				<AiWorkingCard
					job={readJob}
					steps={READ_STEPS}
					onRetry={() => retryJob(FINANCE_READ_JOB)}
					onDismiss={() => dismissJob(FINANCE_READ_JOB)}
				/>
			) : null}
			{items.length > 0 ? (
				<Card>
					<CardHead
						title={`${items.length} ${items.length === 1 ? "item" : "items"}`}
						right={rupees(sum)}
						mono
					/>
					<View>
						{items.map((item, index) => (
							<ListRow
								key={`${item.name}-${index}`}
								title={item.name}
								subtitle={`${CATEGORY_SHORT[item.category]}${groceries.matched[index] ? " · ticked on grocery list" : ""}`}
								value={formatMoney(item.amount)}
								valueTone="textPrimary"
								onPress={() => setEditing(index)}
								last={index === items.length - 1}
							/>
						))}
					</View>
				</Card>
			) : null}
			<Card>
				<Eyebrow>Paid with</Eyebrow>
				<View style={styles.chips}>
					{METHODS.map((item) => (
						<FilterChip
							key={item}
							label={METHOD_LABELS[item]}
							selected={method === item}
							onPress={() => setMethod(item)}
						/>
					))}
				</View>
				{main && data.settings.setUp ? (
					<View style={styles.matchRow}>
						<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
							{`${CATEGORY_SHORT[main]} budget after this`}
						</PoText>
						<PoText variant="row15" tone={mainLeft >= 0 ? "textSuccess" : "textDanger"}>
							{mainLeft >= 0 ? `${rupees(mainLeft)} left` : `${rupees(-mainLeft)} over`}
						</PoText>
					</View>
				) : null}
			</Card>
			{notice ? (
				<PoText variant="meta13" tone="textWarning">
					{notice}
				</PoText>
			) : null}
			<ButtonPair
				secondary={{
					label: "Add item",
					onPress: () => setEditing(items.length),
				}}
				primary={{
					label: saving ? "Saving…" : items.length > 1 ? `Save ${items.length} items` : "Save",
					disabled: saving || items.length === 0,
					onPress: save,
				}}
			/>
			<ItemSheet
				item={editingItem}
				isNew={editing !== null && editing >= items.length}
				onClose={() => setEditing(null)}
				onSave={(item) => {
					setEdited(true);
					setItems((current) => {
						const next = [...current];
						if (editing !== null) next[editing] = item;
						return next;
					});
					setEditing(null);
				}}
				onRemove={() => {
					setEdited(true);
					setItems((current) => current.filter((_, index) => index !== editing));
					setEditing(null);
				}}
			/>
		</FinanceScreen>
	);
}

/** One item: name, amount and budget line. */
function ItemSheet({
	item,
	isNew,
	onClose,
	onSave,
	onRemove,
}: {
	item: SpendItem | null;
	isNew: boolean;
	onClose: () => void;
	onSave: (item: SpendItem) => void;
	onRemove: () => void;
}) {
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState<Category>("other");
	useEffect(() => {
		if (!item) return;
		setName(item.name);
		setAmount(item.amount > 0 ? String(item.amount) : "");
		setCategory(item.category);
	}, [item]);
	if (!item) return null;
	const value = parseAmount(amount);
	return (
		<Sheet
			visible
			title={isNew ? "Add item" : "Item"}
			onClose={onClose}
			footer={
				<View style={styles.pair}>
					{isNew ? null : (
						<PillButton label="Remove" variant="secondary" style={styles.flex} onPress={onRemove} />
					)}
					<PillButton
						label="Done"
						style={styles.flex}
						disabled={!name.trim() || !value}
						onPress={() => onSave({ name: name.trim(), amount: value ?? 0, category })}
					/>
				</View>
			}
		>
			<View style={styles.sheet}>
				<TextField label="What" value={name} onChangeText={setName} placeholder="Bike fuel" />
				<TextField
					label="Amount"
					value={amount}
					onChangeText={setAmount}
					keyboardType="decimal-pad"
					suffix="Rs"
				/>
				<View style={styles.chips}>
					{SPEND_CATEGORIES.map((option) => (
						<FilterChip
							key={option}
							label={CATEGORY_LABELS[option]}
							selected={category === option}
							onPress={() => setCategory(option)}
						/>
					))}
				</View>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	input: { gap: 10, padding: 16, borderRadius: 24, borderWidth: 1.5 },
	text: { minHeight: 48, padding: 0, textAlignVertical: "top" },
	matchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	sheet: { gap: 12 },
	pair: { flexDirection: "row", gap: 10 },
});
