import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { parseAmount } from "@/lib/money";
import { budgetTotal, rupees } from "../lib/finance-math";
import {
	type Bill,
	CATEGORIES,
	type Category,
	CATEGORY_LABELS,
	CATEGORY_SHORT,
	type Entry,
	type FinanceSettings,
	type Source,
} from "../lib/finance-model";

/** Finance's quick-entry sheets: numbers, limits, moving money, income, bills, savings, entries. */

const show = (value: number) => (value > 0 ? String(Math.round(value)) : "");
const read = (value: string) => parseAmount(value) ?? 0;

function Notice({ text }: { text: string | null }) {
	return text ? (
		<PoText variant="meta13" tone="textWarning">
			{text}
		</PoText>
	) : null;
}

function Chips<T extends string>({
	options,
	labels,
	value,
	onChange,
}: {
	options: readonly T[];
	labels: Record<T, string>;
	value: T | null;
	onChange: (value: T) => void;
}) {
	return (
		<View style={styles.chips}>
			{options.map((option) => (
				<FilterChip
					key={option}
					label={labels[option]}
					selected={value === option}
					onPress={() => onChange(option)}
				/>
			))}
		</View>
	);
}

// --- numbers ------------------------------------------------------------------------------------

export type NumbersValue = {
	balance: number;
	monthlyCost: number;
	monthlyIncome: number;
	salary: number;
};

/** "Edit numbers": money now, a month's cost, fixed income and the pay a job would bring. */
export function NumbersSheet({
	visible,
	initial,
	onClose,
	onSave,
}: {
	visible: boolean;
	initial: NumbersValue;
	onClose: () => void;
	onSave: (value: NumbersValue) => void;
}) {
	const [balance, setBalance] = useState("");
	const [cost, setCost] = useState("");
	const [income, setIncome] = useState("");
	const [salary, setSalary] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	useEffect(() => {
		if (!visible) return;
		setBalance(show(initial.balance));
		setCost(show(initial.monthlyCost));
		setIncome(show(initial.monthlyIncome));
		setSalary(show(initial.salary));
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- refill each time it opens
	}, [visible]);

	const save = () => {
		if (!(read(cost) > 0)) {
			setNotice("What does a month cost you?");
			return;
		}
		onSave({
			balance: read(balance),
			monthlyCost: read(cost),
			monthlyIncome: read(income),
			salary: read(salary),
		});
	};

	return (
		<Sheet
			visible={visible}
			title="Edit numbers"
			onClose={onClose}
			action={{ label: "Save", onPress: save }}
		>
			<View style={styles.body}>
				<TextField
					label="Money you have now"
					value={balance}
					onChangeText={setBalance}
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="What a month costs you"
					value={cost}
					onChangeText={setCost}
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="Fixed income each month"
					value={income}
					onChangeText={setIncome}
					placeholder="Nothing fixed yet"
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="Pay once a job starts (for what-ifs)"
					value={salary}
					onChangeText={setSalary}
					placeholder="Covers the month"
					keyboardType="number-pad"
					suffix="Rs"
					onSubmitEditing={save}
				/>
				<Notice text={notice} />
			</View>
		</Sheet>
	);
}

// --- limits -------------------------------------------------------------------------------------

/** "Change limits": a monthly limit per budget line. */
export function LimitsSheet({
	visible,
	limits,
	onClose,
	onSave,
}: {
	visible: boolean;
	limits: Record<Category, number>;
	onClose: () => void;
	onSave: (limits: Record<Category, number>) => void;
}) {
	const [values, setValues] = useState<Record<Category, string>>(() => toStrings(limits));
	useEffect(() => {
		if (visible) setValues(toStrings(limits));
		// oxlint-disable-next-line react/exhaustive-deps -- refill each time it opens
	}, [visible]);
	const next = {} as Record<Category, number>;
	for (const category of CATEGORIES) next[category] = read(values[category]);

	return (
		<Sheet
			visible={visible}
			title="Change limits"
			onClose={onClose}
			action={{ label: `Save · ${rupees(budgetTotal(next))} a month`, onPress: () => onSave(next) }}
		>
			<View style={styles.body}>
				{CATEGORIES.map((category) => (
					<TextField
						key={category}
						label={CATEGORY_LABELS[category]}
						value={values[category]}
						onChangeText={(value) => setValues((current) => ({ ...current, [category]: value }))}
						keyboardType="number-pad"
						suffix="Rs"
					/>
				))}
			</View>
		</Sheet>
	);
}

function toStrings(limits: Record<Category, number>): Record<Category, string> {
	const values = {} as Record<Category, string>;
	for (const category of CATEGORIES) values[category] = show(limits[category]);
	return values;
}

/** "Move money": from one budget line to another, the total stays the same. */
export function MoveSheet({
	visible,
	limits,
	onClose,
	onMove,
}: {
	visible: boolean;
	limits: Record<Category, number>;
	onClose: () => void;
	onMove: (from: Category, to: Category, amount: number) => void;
}) {
	const [from, setFrom] = useState<Category>("other");
	const [to, setTo] = useState<Category>("food");
	const [amount, setAmount] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	useEffect(() => {
		if (visible) {
			setAmount("");
			setNotice(null);
		}
	}, [visible]);
	const move = () => {
		const value = read(amount);
		if (from === to) setNotice("Pick two different lines.");
		else if (!(value > 0)) setNotice("How much?");
		else if (value > limits[from])
			setNotice(`${CATEGORY_SHORT[from]} only has ${rupees(limits[from])}.`);
		else onMove(from, to, value);
	};
	return (
		<Sheet
			visible={visible}
			title="Move money"
			onClose={onClose}
			action={{ label: "Move", onPress: move }}
		>
			<View style={styles.body}>
				<PoText variant="meta13" tone="textSecondary">
					From
				</PoText>
				<Chips options={CATEGORIES} labels={CATEGORY_SHORT} value={from} onChange={setFrom} />
				<PoText variant="meta13" tone="textSecondary">
					To
				</PoText>
				<Chips options={CATEGORIES} labels={CATEGORY_SHORT} value={to} onChange={setTo} />
				<TextField
					label="Amount"
					value={amount}
					onChangeText={setAmount}
					keyboardType="number-pad"
					suffix="Rs"
					onSubmitEditing={move}
				/>
				<Notice text={notice} />
			</View>
		</Sheet>
	);
}

// --- income -------------------------------------------------------------------------------------

export type IncomeValue = {
	amount: number;
	title: string;
	sourceId: string | null;
	newSource: string;
	clean: boolean;
};

/** "Add income": how much, from where, and whether it's interest to give away. */
export function IncomeSheet({
	visible,
	sources,
	onClose,
	onSave,
}: {
	visible: boolean;
	sources: readonly Source[];
	onClose: () => void;
	onSave: (value: IncomeValue) => void;
}) {
	const [amount, setAmount] = useState("");
	const [title, setTitle] = useState("");
	const [sourceId, setSourceId] = useState<string | null>(null);
	const [newSource, setNewSource] = useState("");
	const [interest, setInterest] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	useEffect(() => {
		if (!visible) return;
		setAmount("");
		setTitle("");
		setSourceId(sources[0]?.id ?? null);
		setNewSource("");
		setInterest(false);
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- reset each time it opens
	}, [visible]);
	const source = sources.find((item) => item.id === sourceId) ?? null;
	const save = () => {
		const value = read(amount);
		if (!(value > 0)) {
			setNotice("How much came in?");
			return;
		}
		if (!source && !newSource.trim()) {
			setNotice("Where did it come from?");
			return;
		}
		onSave({
			amount: value,
			title: title.trim(),
			sourceId: newSource.trim() ? null : (source?.id ?? null),
			newSource: newSource.trim(),
			clean: !interest && (newSource.trim() ? true : (source?.halal ?? true)),
		});
	};
	const labels: Record<string, string> = {};
	for (const item of sources) labels[item.id] = item.name;
	return (
		<Sheet
			visible={visible}
			title="Add income"
			onClose={onClose}
			action={{ label: "Add", onPress: save }}
		>
			<View style={styles.body}>
				<TextField
					label="Amount"
					value={amount}
					onChangeText={setAmount}
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="What was it"
					value={title}
					onChangeText={setTitle}
					placeholder="Contract payment"
				/>
				{sources.length > 0 ? (
					<>
						<PoText variant="meta13" tone="textSecondary">
							From
						</PoText>
						<Chips
							options={sources.map((item) => item.id)}
							labels={labels}
							value={newSource.trim() ? null : sourceId}
							onChange={(id) => {
								setSourceId(id);
								setNewSource("");
							}}
						/>
					</>
				) : null}
				<TextField
					label={sources.length > 0 ? "Or a new source" : "From"}
					value={newSource}
					onChangeText={setNewSource}
					placeholder="Contract work, savings account…"
				/>
				<View style={styles.chips}>
					<FilterChip label="Halal" selected={!interest} onPress={() => setInterest(false)} />
					<FilterChip
						label="Interest · give away"
						selected={interest}
						onPress={() => setInterest(true)}
					/>
				</View>
				<Notice text={notice} />
			</View>
		</Sheet>
	);
}

// --- bills --------------------------------------------------------------------------------------

export type BillValue = Omit<Bill, "id" | "paid">;

/** Add or change a bill: name, provider, amount, the day it's due and its budget line. */
export function BillSheet({
	visible,
	bill,
	onClose,
	onSave,
	onDelete,
}: {
	visible: boolean;
	bill: Bill | null;
	onClose: () => void;
	onSave: (value: BillValue) => void;
	onDelete: () => void;
}) {
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("");
	const [amount, setAmount] = useState("");
	const [day, setDay] = useState("");
	const [category, setCategory] = useState<Category>("bills");
	const [notice, setNotice] = useState<string | null>(null);
	useEffect(() => {
		if (!visible) return;
		setName(bill?.name ?? "");
		setProvider(bill?.provider ?? "");
		setAmount(show(bill?.amount ?? 0));
		setDay(bill ? String(bill.dueDay) : "");
		setCategory(bill?.category ?? "bills");
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- refill each time it opens
	}, [visible]);
	const save = () => {
		const value = read(amount);
		const due = Math.round(Number(day));
		if (!name.trim()) setNotice("What's the bill?");
		else if (!(value > 0)) setNotice("How much is it?");
		else if (!(due >= 1 && due <= 31)) setNotice("Which day of the month is it due? 1 to 31.");
		else
			onSave({
				name: name.trim(),
				provider: provider.trim(),
				amount: value,
				dueDay: due,
				category,
			});
	};
	return (
		<Sheet
			visible={visible}
			title={bill ? bill.name : "Add a bill"}
			onClose={onClose}
			footer={
				<View style={styles.row}>
					{bill ? (
						<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={onDelete} />
					) : null}
					<PillButton label="Save" style={styles.flex} onPress={save} />
				</View>
			}
		>
			<View style={styles.body}>
				<TextField label="Bill" value={name} onChangeText={setName} placeholder="Electricity" />
				<TextField
					label="Provider"
					value={provider}
					onChangeText={setProvider}
					placeholder="Optional"
				/>
				<TextField
					label="Amount"
					value={amount}
					onChangeText={setAmount}
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="Due on day"
					value={day}
					onChangeText={setDay}
					keyboardType="number-pad"
					placeholder="18"
				/>
				<Chips
					options={CATEGORIES}
					labels={CATEGORY_SHORT}
					value={category}
					onChange={setCategory}
				/>
				<Notice text={notice} />
			</View>
		</Sheet>
	);
}

// --- savings ------------------------------------------------------------------------------------

/** Put money aside toward the after-the-job goal, or change the goal. */
export function SavingsSheet({
	visible,
	settings,
	onClose,
	onSave,
}: {
	visible: boolean;
	settings: FinanceSettings;
	onClose: () => void;
	onSave: (add: number, target: number) => void;
}) {
	const [add, setAdd] = useState("");
	const [target, setTarget] = useState("");
	useEffect(() => {
		if (!visible) return;
		setAdd("");
		setTarget(show(settings.savingsTarget));
		// oxlint-disable-next-line react/exhaustive-deps -- refill each time it opens
	}, [visible]);
	return (
		<Sheet
			visible={visible}
			title="Savings goal"
			onClose={onClose}
			action={{ label: "Save", onPress: () => onSave(read(add), read(target)) }}
		>
			<View style={styles.body}>
				<PoText variant="meta13" tone="textSecondary">
					{`${rupees(settings.saved)} put aside so far. Six months of costs is a safe cushion once salary starts.`}
				</PoText>
				<TextField
					label="Put aside now"
					value={add}
					onChangeText={setAdd}
					keyboardType="number-pad"
					suffix="Rs"
				/>
				<TextField
					label="Goal"
					value={target}
					onChangeText={setTarget}
					keyboardType="number-pad"
					suffix="Rs"
				/>
			</View>
		</Sheet>
	);
}

// --- one entry ----------------------------------------------------------------------------------

/** Change or delete one history entry. */
export function EntrySheet({
	entry,
	onClose,
	onSave,
	onDelete,
}: {
	entry: Entry | null;
	onClose: () => void;
	onSave: (entry: Entry) => void;
	onDelete: (entry: Entry) => void;
}) {
	const [title, setTitle] = useState("");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState<Category>("other");
	useEffect(() => {
		if (!entry) return;
		setTitle(entry.title);
		setAmount(String(entry.amount));
		setCategory(entry.category);
	}, [entry]);
	if (!entry) return null;
	return (
		<Sheet
			visible
			title={entry.kind === "income" ? "Income" : "Spending"}
			onClose={onClose}
			footer={
				<View style={styles.row}>
					<PillButton
						label="Delete"
						variant="secondary"
						style={styles.flex}
						onPress={() => onDelete(entry)}
					/>
					<PillButton
						label="Save"
						style={styles.flex}
						onPress={() =>
							onSave({
								...entry,
								title: title.trim() || entry.title,
								amount: read(amount) || entry.amount,
								category: entry.kind === "income" ? "other" : category,
							})
						}
					/>
				</View>
			}
		>
			<View style={styles.body}>
				<TextField label="What" value={title} onChangeText={setTitle} />
				<TextField
					label="Amount"
					value={amount}
					onChangeText={setAmount}
					keyboardType="decimal-pad"
					suffix="Rs"
				/>
				{entry.kind === "spend" ? (
					<Chips
						options={CATEGORIES}
						labels={CATEGORY_SHORT}
						value={category}
						onChange={setCategory}
					/>
				) : null}
			</View>
		</Sheet>
	);
}

// --- offer check --------------------------------------------------------------------------------

/** "Check an offer": paste or say the offer; the AI checks it against the money rules. */
export function OfferSheet({
	visible,
	onClose,
	onCheck,
}: {
	visible: boolean;
	onClose: () => void;
	onCheck: (text: string) => void;
}) {
	const [text, setText] = useState("");
	useEffect(() => {
		if (visible) setText("");
	}, [visible]);
	return (
		<Sheet
			visible={visible}
			title="Check an offer"
			onClose={onClose}
			action={{ label: "Check it", disabled: !text.trim(), onPress: () => onCheck(text.trim()) }}
		>
			<View style={styles.body}>
				<PoText variant="meta13" tone="textSecondary">
					A job, a loan, an instalment plan or an account. The AI checks it for interest, markup and
					what it does to your runway.
				</PoText>
				<TextField
					label="The offer"
					value={text}
					onChangeText={setText}
					placeholder="Bike on 12 instalments of Rs 9,000"
				/>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	body: { gap: 12 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	row: { flexDirection: "row", gap: 10 },
	flex: { flex: 1 },
});
