import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { PoText } from "@/components/ui/po-text";
import { rise, usePoTheme } from "@/theme";
import { monthShort } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { CURRENCY, formatMoney } from "@/lib/money";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useHomeView } from "@/modules/home/store/home-view";
import { useNow } from "../hooks/use-now";
import {
	categoryTotals,
	dailyBudget,
	dailyRange,
	expensesOnDay,
	lastEntryDate,
	leftToSpend,
	relativeTime,
	savingsProgress,
	spentThisMonth,
	sumAmounts,
} from "../lib/finance-math";
import { CATEGORY_LABELS } from "../lib/finance-model";
import { parseFinanceText } from "../lib/parse-finance-text";
import { captureReceiptPhoto } from "../services/receipt-photo";
import {
	addExpense,
	addSavings,
	type NewExpense,
	removeExpense,
	removeSavingsGoal,
	setBudget,
	setSavingsTarget,
	useFinanceStore,
} from "../store/finance-store";
import { AddExpenseSheet, type ExpenseDraft, emptyExpenseDraft } from "./add-expense-sheet";
import { BudgetSheet } from "./budget-sheet";
import { FinanceMoneyCard } from "./finance-money-card";
import { RangeBarCard } from "./range-bar-card";
import { SavingsGoalCard } from "./savings-goal-card";
import { SavingsSheet } from "./savings-sheet";
import { SpendBreakdownCard } from "./spend-breakdown-card";

type OpenSheet =
	| { kind: "expense"; draft: ExpenseDraft }
	| { kind: "budget"; initial?: string }
	| { kind: "savings"; initialAdd?: string }
	| null;

type Confirmation = { text: string; undoExpenseId?: string };

const CONFIRM_MS = 5000;

/** Finance Home: money card, ask bar, today's spending, daily range and the savings goal. */
export function FinanceHomeView({ actionRequest }: HomeModuleViewProps) {
	const data = useFinanceStore((state) => state.data);
	const hydrate = useFinanceStore((state) => state.hydrate);
	const hidden = useHomeView((state) => state.data.amountsHidden);
	const hydrateHomeView = useHomeView((state) => state.hydrate);
	const updateHomeView = useHomeView((state) => state.update);
	const now = useNow();
	const [sheet, setSheet] = useState<OpenSheet>(null);
	const [sheetKey, setSheetKey] = useState(0);
	const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load finance", error));
		hydrateHomeView().catch((error: unknown) => console.error("Could not load home view", error));
	}, [hydrate, hydrateHomeView]);

	useEffect(() => {
		if (!confirmation) return;
		const timer = setTimeout(() => setConfirmation(null), CONFIRM_MS);
		return () => clearTimeout(timer);
	}, [confirmation]);

	const open = useCallback((next: OpenSheet) => {
		setSheetKey((key) => key + 1);
		setSheet(next);
	}, []);
	const close = () => setSheet(null);

	const scanReceipt = useCallback(async () => {
		const result = await captureReceiptPhoto();
		if (result.status === "captured") {
			open({ kind: "expense", draft: { ...emptyExpenseDraft, receiptUri: result.uri } });
		} else if (result.status === "denied") {
			open({
				kind: "expense",
				draft: {
					...emptyExpenseDraft,
					notice: "Camera access is off, so no photo this time. You can still add it by hand.",
				},
			});
		} else if (result.status === "unavailable") {
			open({
				kind: "expense",
				draft: {
					...emptyExpenseDraft,
					notice: "The camera could not open here. Add the expense by hand.",
				},
			});
		}
	}, [open]);

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		void scanReceipt();
	}, [actionRequest, scanReceipt]);

	const view = useMemo(() => {
		const today = expensesOnDay(data.expenses, now);
		const last = lastEntryDate(data.expenses);
		return {
			left: leftToSpend(data.budget, spentThisMonth(data.expenses, now)),
			todayTotal: sumAmounts(today),
			totals: categoryTotals(today),
			perDay: dailyBudget(data.budget, now),
			range: dailyRange(data.expenses, now),
			lastEntry: last ? relativeTime(last, now) : null,
			savings: data.goal ? savingsProgress(data.goal, now) : null,
		};
	}, [data, now]);

	const saveExpense = (input: NewExpense) => {
		const expense = addExpense(input);
		haptics.success();
		close();
		setConfirmation({
			text: `Added ${formatMoney(expense.amount)} · ${CATEGORY_LABELS[expense.category]}`,
		});
	};

	const submitAsk = (text: string) => {
		const intent = parseFinanceText(text);
		if (intent.kind === "expense") {
			const expense = addExpense(intent);
			haptics.success();
			const label = intent.note || CATEGORY_LABELS[intent.category];
			setConfirmation({
				text: `Added ${formatMoney(expense.amount)} · ${label}`,
				undoExpenseId: expense.id,
			});
		} else if (intent.kind === "budget") {
			setBudget(intent.amount);
			haptics.success();
			setConfirmation({ text: `Budget set to ${formatMoney(intent.amount)} a month` });
		} else if (intent.kind === "saving" && data.goal) {
			addSavings(intent.amount);
			haptics.success();
			setConfirmation({ text: `Added ${formatMoney(intent.amount)} to savings` });
		} else if (intent.kind === "saving") {
			open({ kind: "savings", initialAdd: String(intent.amount) });
		} else {
			open({
				kind: "expense",
				draft: {
					amount: intent.amount === null ? "" : String(intent.amount),
					category: intent.category ?? "other",
					note: intent.note,
				},
			});
		}
	};

	return (
		<View style={styles.column}>
			<Animated.View entering={rise(0)}>
				<FinanceMoneyCard
					period={`${CURRENCY.code} · ${monthShort(now).toUpperCase()}`}
					left={view.left}
					hidden={hidden}
					onToggleHidden={() =>
						updateHomeView((doc) => ({ ...doc, amountsHidden: !doc.amountsHidden }))
					}
					onEditBudget={() => open({ kind: "budget" })}
				/>
			</Animated.View>
			<View>
				<AskBar
					placeholder="500 food, spent 1200 on transport…"
					suggestions={[
						{
							label: "Add expense",
							onPress: () => open({ kind: "expense", draft: emptyExpenseDraft }),
						},
						{ label: "Scan receipt", onPress: () => void scanReceipt() },
						{ label: "Set budget", onPress: () => open({ kind: "budget" }) },
					]}
					onSubmit={submitAsk}
				/>
				{confirmation ? (
					<ConfirmationLine
						confirmation={confirmation}
						onUndo={(id) => {
							removeExpense(id);
							setConfirmation({ text: "Removed" });
						}}
					/>
				) : null}
			</View>
			<Animated.View entering={rise(80)}>
				<SpendBreakdownCard
					todayTotal={view.todayTotal}
					totals={view.totals}
					dailyBudget={view.perDay}
					onAddExpense={() => open({ kind: "expense", draft: emptyExpenseDraft })}
					onSetBudget={() => open({ kind: "budget" })}
				/>
			</Animated.View>
			<Animated.View entering={rise(160)}>
				<RangeBarCard range={view.range} lastEntry={view.lastEntry} />
			</Animated.View>
			<Animated.View entering={rise(240)}>
				<SavingsGoalCard progress={view.savings} onManage={() => open({ kind: "savings" })} />
			</Animated.View>

			{sheet?.kind === "expense" ? (
				<AddExpenseSheet
					key={sheetKey}
					visible
					draft={sheet.draft}
					onClose={close}
					onSave={saveExpense}
				/>
			) : null}
			{sheet?.kind === "budget" ? (
				<BudgetSheet
					key={sheetKey}
					visible
					budget={data.budget}
					initialAmount={sheet.initial}
					onClose={close}
					onSave={(budget) => {
						setBudget(budget);
						haptics.success();
						close();
					}}
				/>
			) : null}
			{sheet?.kind === "savings" ? (
				<SavingsSheet
					key={sheetKey}
					visible
					target={data.goal?.target ?? null}
					saved={view.savings?.saved ?? 0}
					initialAdd={sheet.initialAdd}
					onClose={close}
					onSetTarget={(target) => {
						setSavingsTarget(target);
						haptics.success();
						close();
					}}
					onAdd={(amount) => {
						addSavings(amount);
						haptics.success();
						close();
					}}
					onRemove={() => {
						removeSavingsGoal();
						close();
					}}
				/>
			) : null}
		</View>
	);
}

function ConfirmationLine({
	confirmation,
	onUndo,
}: {
	confirmation: Confirmation;
	onUndo: (expenseId: string) => void;
}) {
	const { colors } = usePoTheme();
	const undoId = confirmation.undoExpenseId;
	return (
		<Animated.View
			entering={rise(0)}
			accessibilityLiveRegion="polite"
			style={[styles.confirm, { backgroundColor: colors.statusSuccessSubtle }]}
		>
			<PoText variant="meta13" tone="textSuccess" style={styles.confirmText} numberOfLines={1}>
				{confirmation.text}
			</PoText>
			{undoId ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Undo"
					hitSlop={10}
					onPress={() => onUndo(undoId)}
				>
					<PoText variant="meta13" tone="textLink">
						Undo
					</PoText>
				</Pressable>
			) : null}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	column: { gap: 16 },
	confirm: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginTop: 4,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 16,
	},
	confirmText: { flex: 1 },
});
