import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { ActionPills, ResultCard } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { usePoTheme } from "@/theme";
import {
	addSavings,
	deleteBill,
	deleteEntries,
	ensureSource,
	logIncome,
	logSpend,
	newBill,
	payBill,
	saveBill,
	saveSettings,
	setUp,
} from "../data/finance-actions";
import { FINANCE_ASK_JOB, FINANCE_READ_JOB, useFinanceUi } from "../hooks/finance-ui-store";
import { useFinanceAsk } from "../hooks/use-finance-ask";
import { useFinanceToday } from "../hooks/use-finance";
import {
	balanceTone,
	bufferLine,
	dayLabel,
	entryLine,
	MONTH_DAYS,
	MONTHS,
	project,
	rupees,
	signed,
	upcomingBills,
} from "../lib/finance-math";
import type { Bill, Entry } from "../lib/finance-model";
import { type FinanceIntent, parseFinanceLine } from "../lib/parse-finance-line";
import { financeRoutes } from "../navigation";
import { financeAiMessage, useFinanceAi } from "../services/finance-ai";
import { captureReceiptPhoto } from "../services/receipt-photo";
import {
	AnswerCard,
	BillsCard,
	Card,
	Eyebrow,
	MonthSpendCard,
	NumberField,
	RecentCard,
	RunwayCard,
	SavingsCard,
} from "./finance-cards";
import { BillSheet, SavingsSheet } from "./finance-sheets";

const ASK_STEPS = ["Reading your month", "Checking the runway", "Writing an answer"] as const;
const READ_STEPS = ["Reading what you spent", "Splitting it into items"] as const;

const digits = (value: number) => (value > 0 ? String(Math.round(value)) : "");

/** Finance Home: runway, this month's spend, bills, recent entries and the savings goal. */
export function FinanceHomeView({ actionRequest }: HomeModuleViewProps) {
	const { colors } = usePoTheme();
	const today = useFinanceToday();
	const { data, now, balance, burn, cost, spent, budget, sums, pace } = today;
	const { settings, entries, bills, sources } = data;
	const ui = useFinanceUi();
	const ai = useFinanceAi();
	const askJob = useAiJobs((state) => state.jobs[FINANCE_ASK_JOB]);
	const readJob = useAiJobs((state) => state.jobs[FINANCE_READ_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [notice, setNotice] = useState<string | null>(null);
	const [logged, setLogged] = useState<{ quote: string; entries: Entry[] } | null>(null);
	const [billSheet, setBillSheet] = useState<{ bill: Bill | null } | null>(null);
	const [saving, setSaving] = useState(false);
	const [setup, setSetup] = useState({ balance: "", cost: "", income: "" });
	const [starting, setStarting] = useState(false);
	const ask = useFinanceAsk(setNotice);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[finance] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const scan = () => {
		void captureReceiptPhoto().then((result) => {
			if (result.status === "captured") {
				ui.setDraft({ text: "", items: [], method: "cash", receiptUri: result.uri });
				financeRoutes.log();
			} else if (result.status === "denied") {
				setNotice("Camera is off for Personal OS. Allow it in Settings to scan receipts.");
			} else if (result.status === "unavailable") {
				setNotice("Couldn't open the camera. Type what you spent instead.");
			}
		});
	};

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		scan();
		// oxlint-disable-next-line react/exhaustive-deps -- runs when the header button is pressed
	}, [actionRequest]);

	const done = (quote: string, saved: Entry[], spoken: boolean) => {
		haptics.success();
		setLogged({ quote, entries: saved });
		if (spoken) {
			const sum = saved.reduce((total, item) => total + item.amount, 0);
			voiceOut.speak(`Saved ${rupees(sum)}.`);
		}
	};

	const act = (text: string, intent: FinanceIntent, spoken: boolean) => {
		switch (intent.kind) {
			case "question":
				ask(intent.text, spoken);
				return;
			case "open":
				if (intent.screen === "bills") setBillSheet({ bill: null });
				else financeRoutes[intent.screen]();
				return;
			case "save":
				addSavings(settings, intent.amount)
					.then(() => {
						haptics.success();
						setNotice(`${rupees(intent.amount)} put aside for after the job.`);
					})
					.catch(failed("save that"));
				return;
			case "income": {
				const lower = text.toLowerCase();
				const match = sources.find((source) => lower.includes(source.name.toLowerCase()));
				const source = match ? Promise.resolve(match) : ensureSource("Other income");
				source
					.then((found) =>
						logIncome({
							amount: intent.amount,
							title: intent.title,
							source: found,
							clean: intent.clean,
						}),
					)
					.then((saved) => done(text, [saved], spoken))
					.catch(failed("log the income"));
				return;
			}
			case "spend":
				if (spoken) {
					logSpend(intent.items, intent.method ?? "cash")
						.then((saved) => done(text, saved, spoken))
						.catch(failed("log that"));
				} else {
					ui.setDraft({
						text,
						items: intent.items,
						method: intent.method ?? "cash",
						receiptUri: null,
					});
					financeRoutes.log();
				}
				return;
			case "unclear":
				if (!ai.available) {
					ui.setDraft({ text, items: [], method: "cash", receiptUri: null });
					financeRoutes.log();
					return;
				}
				startJob(FINANCE_READ_JOB, "Reading what you spent", async () => {
					try {
						const reading = await ai.read(text);
						if (reading.items.length === 0) throw new Error("empty");
						const next: FinanceIntent = {
							kind: "spend",
							items: reading.items,
							method: reading.method,
						};
						act(text, next, spoken);
					} catch (error) {
						throw new Error(
							error instanceof Error && error.message === "empty"
								? "Couldn't find amounts in that. Try “fuel 1500”."
								: financeAiMessage(error),
							{ cause: error },
						);
					}
				});
		}
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseFinanceLine(text);
		setNotice(null);
		if (intent) act(text, intent, spoken);
	};

	// A line said on Talk to OS lands here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "finance") return;
		const line = useAskInbox.getState().take("finance");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const askBar = (
		<View style={styles.ask}>
			<AskBar suggestions={[]} placeholder="Log spending or ask about money…" onSubmit={onLine} />
			<ActionPills
				actions={[
					{
						label: "Spent",
						icon: "Line/Plus",
						onPress: () => {
							ui.setDraft(null);
							financeRoutes.log();
						},
					},
					{ label: "Scan", icon: "Filled/Scan", onPress: scan },
					{ label: "Budget", icon: "Wallet", onPress: financeRoutes.budget },
				]}
			/>
		</View>
	);

	const extras = (
		<>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{logged ? (
				<ResultCard
					quote={logged.quote}
					offline={!ai.available}
					rows={logged.entries.map((item) => ({
						title: item.title,
						subtitle: entryLine(item, now, false),
						value: signed(item),
					}))}
					onUndo={() => {
						void deleteEntries(logged.entries).catch(failed("undo"));
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{readJob ? (
				<AiWorkingCard
					job={readJob}
					steps={READ_STEPS}
					onRetry={() => retryJob(FINANCE_READ_JOB)}
					onDismiss={() => dismissJob(FINANCE_READ_JOB)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(FINANCE_ASK_JOB)}
					onDismiss={() => dismissJob(FINANCE_ASK_JOB)}
				/>
			) : ui.answer ? (
				<AnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}
			<BillSheet
				visible={billSheet !== null}
				bill={billSheet?.bill ?? null}
				onClose={() => setBillSheet(null)}
				onSave={(value) => {
					const bill = billSheet?.bill;
					void saveBill(bill ? { ...bill, ...value } : newBill(value))
						.then(() => haptics.success())
						.catch(failed("save the bill"));
					setBillSheet(null);
				}}
				onDelete={() => {
					const bill = billSheet?.bill;
					if (bill) void deleteBill(bill).catch(failed("delete the bill"));
					setBillSheet(null);
				}}
			/>
			<SavingsSheet
				visible={saving}
				settings={settings}
				onClose={() => setSaving(false)}
				onSave={(add, target) => {
					void saveSettings({
						...settings,
						saved: Math.max(0, settings.saved + add),
						savingsTarget: target > 0 ? target : settings.savingsTarget,
					})
						.then(() => haptics.success())
						.catch(failed("save the goal"));
					setSaving(false);
				}}
			/>
		</>
	);

	if (!data.loading && !settings.setUp) {
		const typed = {
			balance: parseAmount(setup.balance) ?? 0,
			cost: parseAmount(setup.cost) ?? 0,
			income: parseAmount(setup.income) ?? 0,
		};
		const preview =
			typed.cost > typed.income
				? Math.floor(typed.balance / ((typed.cost - typed.income) / MONTH_DAYS))
				: null;
		return (
			<>
				<Card>
					<Eyebrow>Three numbers, that's it</Eyebrow>
					<NumberField
						label="Money you have now"
						value={setup.balance}
						placeholder={digits(settings.balance) || "Rs 148,500"}
						onChangeText={(value) => setSetup((current) => ({ ...current, balance: value }))}
					/>
					<NumberField
						label="What a month costs you"
						value={setup.cost}
						placeholder={digits(settings.monthlyCost) || "Rs 55,000"}
						onChangeText={(value) => setSetup((current) => ({ ...current, cost: value }))}
					/>
					<NumberField
						label="Income coming in"
						value={setup.income}
						placeholder="Nothing fixed yet"
						onChangeText={(value) => setSetup((current) => ({ ...current, income: value }))}
					/>
					{typed.balance > 0 && typed.cost > 0 ? (
						<View style={styles.previewRow}>
							<View style={[styles.dot, { backgroundColor: colors.statusCaution }]} />
							<PoText variant="row15" tone="textWarning">
								{preview === null
									? "Income covers the month."
									: `That's about ${preview} days of runway`}
							</PoText>
						</View>
					) : null}
					<PillButton
						label={starting ? "Starting…" : "Start runway mode"}
						disabled={starting || !(typed.balance > 0 && typed.cost > 0)}
						onPress={() => {
							setStarting(true);
							setUp(settings, {
								balance: typed.balance,
								monthlyCost: typed.cost,
								monthlyIncome: typed.income,
							})
								.then(() => haptics.success())
								.catch(failed("start runway mode"))
								.finally(() => setStarting(false));
						}}
					/>
				</Card>
				{askBar}
				{extras}
			</>
		);
	}

	const projection = project(balance, settings, now);
	const bars = projection.points.map((point, index) => ({
		label: (MONTHS[point.at.getMonth()] ?? "").slice(0, 3).toUpperCase(),
		balance: index === 0 ? balance : point.balance,
		tone: balanceTone(index === 0 ? balance : point.balance, cost),
	}));
	const due = upcomingBills(bills, now);
	const thisMonth = due.filter((item) => item.due.getMonth() === now.getMonth());
	const billRows = due.slice(0, 3).map((item) => ({
		id: item.bill.id,
		name: item.bill.name,
		line: [item.bill.provider, item.overdue ? `was due ${dayLabel(item.due)}` : dayLabel(item.due)]
			.filter(Boolean)
			.join(" · "),
		amount: item.bill.amount,
		overdue: item.overdue,
	}));
	const recent = entries.slice(0, 3).map((item) => ({
		id: item.id,
		title: item.title,
		line: entryLine(item, now),
		amount: signed(item),
		income: item.kind === "income",
		category: item.category,
	}));
	const months = Math.max(
		1,
		Math.round(settings.savingsTarget / Math.max(1, settings.monthlyCost)),
	);

	return (
		<>
			{askBar}
			{extras}
			<RunwayCard
				bars={bars}
				burn={burn}
				line={bufferLine(balance, settings, now)}
				onPress={financeRoutes.runway}
			/>
			<MonthSpendCard
				month={now.getMonth()}
				spent={spent}
				budget={budget}
				sums={sums}
				daysLeft={pace.daysLeft}
				perDay={pace.perDay}
				onPress={financeRoutes.budget}
			/>
			<BillsCard
				rows={billRows}
				count={thisMonth.length}
				onPay={(id) => {
					const item = due.find((each) => each.bill.id === id);
					if (!item) return;
					payBill(item.bill, item.due)
						.then((saved) => done(`Paid ${item.bill.name}`, [saved], false))
						.catch(failed("pay the bill"));
				}}
				onOpen={(id) => setBillSheet({ bill: bills.find((bill) => bill.id === id) ?? null })}
				onAdd={() => setBillSheet({ bill: null })}
			/>
			{recent.length > 0 ? (
				<RecentCard
					rows={recent}
					onRow={() => financeRoutes.history()}
					onAll={financeRoutes.history}
				/>
			) : null}
			<SavingsCard
				months={months}
				saved={settings.saved}
				target={settings.savingsTarget}
				onPress={() => setSaving(true)}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
	previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
});
