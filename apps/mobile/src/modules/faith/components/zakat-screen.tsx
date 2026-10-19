import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Footer, ListRow, ScreenTitle, SectionLabel, Segments } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { formatMoney, parseAmount } from "@/lib/money";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { addPayment, removePayment, saveZakat } from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import { hijriMonthName, lakhs, shortRupees, toHijri, zakatView } from "../lib/faith-math";
import type { ZakatProfile } from "../lib/faith-model";
import { FaithScreen } from "./faith-screen";

/** Zakat: what is due this lunar year, how long it has been held and what has been paid. */
export function ZakatScreen() {
	const { colors } = usePoTheme();
	const { zakat, payments } = useFaith();
	const now = useNow();
	const view = zakatView(zakat, payments, now);
	const [editing, setEditing] = useState(false);
	const [paying, setPaying] = useState<number | null>(null);
	const empty = view.owned === 0;
	const since = view.hawl?.start ?? null;
	const dueOn = view.hawl?.end ?? null;
	const parts = [
		{ key: "gold", label: "Gold", amount: zakat.gold, tone: colors.statusCaution },
		{ key: "cash", label: "Cash", amount: zakat.cash, tone: colors.accentDefault },
		{ key: "savings", label: "Savings", amount: zakat.savings, tone: colors.statusSuccess },
	];
	const scale = Math.max(view.owned, zakat.nisab, 1);
	const recent = payments.filter((payment) => !since || new Date(payment.at) >= since);

	return (
		<FaithScreen
			action={{ icon: "Filled/Edit", label: "Edit what you own", onPress: () => setEditing(true) }}
		>
			<ScreenTitle eyebrow={`Zakat · ${toHijri(now).year} AH`} title="Zakat" />

			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<PoText variant="eyebrow11" tone="textTertiary">
					Zakat due this year
				</PoText>
				<View style={styles.dueRow}>
					<PoText variant="display36" style={styles.flex} numberOfLines={1} adjustsFontSizeToFit>
						{formatMoney(view.due)}
					</PoText>
					<View
						style={[
							styles.badge,
							{ backgroundColor: view.aboveNisab ? colors.statusSuccessSubtle : colors.bgSubtle },
						]}
					>
						{view.aboveNisab ? (
							<Icon name="Line/Check" size={12} color={colors.textSuccess} />
						) : null}
						<PoText variant="meta13" tone={view.aboveNisab ? "textSuccess" : "textSecondary"}>
							{view.aboveNisab ? "Above nisab" : "Below nisab"}
						</PoText>
					</View>
				</View>
				<View style={styles.barWrap}>
					<PoText
						variant="eyebrow11"
						tone="textSecondary"
						style={[styles.nisabLabel, { left: `${(zakat.nisab / scale) * 100}%` }]}
					>
						Nisab Rs {lakhs(zakat.nisab)}
					</PoText>
					<View style={styles.bar}>
						{parts
							.filter((part) => part.amount > 0)
							.map((part) => (
								<View
									key={part.key}
									style={{ flex: part.amount, backgroundColor: part.tone, borderRadius: 5 }}
								/>
							))}
						{view.owned < scale ? (
							<View
								style={{
									flex: scale - view.owned,
									backgroundColor: colors.bgSubtle,
									borderRadius: 5,
								}}
							/>
						) : null}
					</View>
					<View
						style={[
							styles.nisabMark,
							{ left: `${(zakat.nisab / scale) * 100}%`, backgroundColor: colors.textPrimary },
						]}
					/>
				</View>
				<View style={styles.legend}>
					{parts.map((part) => (
						<View key={part.key} style={styles.legendItem}>
							<View style={[styles.dot, { backgroundColor: part.tone }]} />
							<PoText variant="meta13" tone="textSecondary">
								{part.label} {shortRupees(part.amount)}
							</PoText>
						</View>
					))}
				</View>
				<PoText variant="meta13" tone="textTertiary">
					{empty
						? "Add what you own to work it out."
						: `${Math.round(zakat.rate * 1000) / 10}% of Rs ${lakhs(view.net)}${zakat.debts > 0 ? `, after Rs ${lakhs(zakat.debts)} you owe` : ""}`}
				</PoText>
			</View>

			<SectionLabel>Hawl · lunar year</SectionLabel>
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{since && dueOn ? (
					<>
						<View style={styles.dueRow}>
							<PoText variant="row15" style={styles.flex}>
								{view.monthsHeld} of 12 months held
							</PoText>
							<PoText variant="meta13" tone="accentDefault">
								{view.monthsLeft === 0
									? "due now"
									: `due in ${view.monthsLeft} month${view.monthsLeft === 1 ? "" : "s"}`}
							</PoText>
						</View>
						<Segments total={12} done={view.monthsHeld} />
						<View style={styles.dueRow}>
							<PoText variant="mono13" tone="textTertiary" style={styles.flex}>
								Started {hijriMonthName(toHijri(since).month)}
							</PoText>
							<PoText variant="mono13" tone="textTertiary">
								{hijriMonthName(toHijri(dueOn).month)}
							</PoText>
						</View>
					</>
				) : (
					<>
						<PoText variant="text14" tone="textSecondary">
							Zakat is due a lunar year after your wealth first reached nisab. Add that date to
							count the months.
						</PoText>
						<PillButton
							label="Add the start date"
							variant="secondary"
							onPress={() => setEditing(true)}
						/>
					</>
				)}
			</View>

			<SectionLabel>{`Paid this year · Rs ${lakhs(view.paid)} of ${lakhs(view.due)}`}</SectionLabel>
			<View
				style={[
					styles.list,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{recent.map((payment) => (
					<ListRow
						key={payment.id}
						leading={
							<View style={[styles.initials, { backgroundColor: colors.statusSuccessSubtle }]}>
								<PoText variant="mono13" tone="textSuccess">
									{initials(payment.to)}
								</PoText>
							</View>
						}
						title={payment.to}
						subtitle={[hijriMonthName(toHijri(new Date(payment.at)).month), payment.note]
							.filter(Boolean)
							.join(" · ")}
						value={formatMoney(payment.amount)}
						valueTone="textPrimary"
						onPress={() =>
							Alert.alert(
								payment.to,
								`${formatMoney(payment.amount)} on ${dayKey(new Date(payment.at))}`,
								[
									{ text: "Keep", style: "cancel" },
									{
										text: "Delete",
										style: "destructive",
										onPress: () =>
											void removePayment(payment).catch((error: unknown) =>
												console.error("[faith] could not delete the payment", error),
											),
									},
								],
							)
						}
					/>
				))}
				<Pressable
					accessibilityRole="button"
					onPress={() => setPaying(view.left)}
					style={[styles.addRow, { borderColor: colors.borderDefault }]}
				>
					<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
					<PoText variant="meta13" tone="textSecondary">
						{view.left > 0 ? `Rs ${lakhs(view.left)} left · record a payment` : "Record a payment"}
					</PoText>
				</Pressable>
			</View>

			<View style={[styles.note, { backgroundColor: colors.bgSurface }]}>
				<Icon name="Help" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
					Nisab moves with the price of gold or silver, so update it in Edit. This is an estimate:
					check your own case with a scholar of your tradition.
				</PoText>
			</View>

			<Footer>
				<PillButton
					label="Edit what you own"
					variant="secondary"
					onPress={() => setEditing(true)}
					style={styles.flex}
				/>
				<PillButton
					label={view.left > 0 ? `Pay ${formatMoney(view.left)}` : "Record a payment"}
					onPress={() => setPaying(view.left)}
					style={styles.flex}
				/>
			</Footer>

			{editing ? <OwnedSheet profile={zakat} onClose={() => setEditing(false)} /> : null}
			{paying !== null ? <PaymentSheet amount={paying} onClose={() => setPaying(null)} /> : null}
		</FaithScreen>
	);
}

function initials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? "")
			.join("") || "•"
	);
}

const amountText = (value: number) => (value > 0 ? String(value) : "");

/** An empty field counts as 0; anything else must read as an amount. */
function read(text: string): number | null {
	return text.trim() ? parseAmount(text) : 0;
}

/** What the person owns and owes, the nisab they checked and when the year started. */
function OwnedSheet({ profile, onClose }: { profile: ZakatProfile; onClose: () => void }) {
	const [gold, setGold] = useState(amountText(profile.gold));
	const [cash, setCash] = useState(amountText(profile.cash));
	const [savings, setSavings] = useState(amountText(profile.savings));
	const [debts, setDebts] = useState(amountText(profile.debts));
	const [nisab, setNisab] = useState(amountText(profile.nisab));
	const [rate, setRate] = useState(String(Math.round(profile.rate * 1000) / 10));
	const [start, setStart] = useState(profile.hawlStart ?? "");

	const values = {
		gold: read(gold),
		cash: read(cash),
		savings: read(savings),
		debts: read(debts),
		nisab: read(nisab),
	};
	const rateValue = Number(rate);
	const startOk =
		!start.trim() ||
		(/^\d{4}-\d{2}-\d{2}$/.test(start.trim()) && !Number.isNaN(Date.parse(start.trim())));
	const valid =
		Object.values(values).every((value) => value !== null) &&
		Number.isFinite(rateValue) &&
		rateValue >= 0 &&
		rateValue <= 100 &&
		startOk;

	return (
		<Sheet
			visible
			title="What you own"
			onClose={onClose}
			action={{
				label: "Save",
				disabled: !valid,
				onPress: () => {
					void saveZakat({
						...profile,
						gold: values.gold ?? 0,
						cash: values.cash ?? 0,
						savings: values.savings ?? 0,
						debts: values.debts ?? 0,
						nisab: values.nisab ?? profile.nisab,
						rate: rateValue / 100,
						hawlStart: start.trim() || null,
					}).catch((error: unknown) => console.error("[faith] could not save zakat", error));
					onClose();
				},
			}}
		>
			<TextField
				label="Gold and silver (value)"
				value={gold}
				onChangeText={setGold}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Cash"
				value={cash}
				onChangeText={setCash}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Savings and investments"
				value={savings}
				onChangeText={setSavings}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Debts due now"
				value={debts}
				onChangeText={setDebts}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Nisab today"
				value={nisab}
				onChangeText={setNisab}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<TextField
				label="Rate"
				value={rate}
				onChangeText={setRate}
				keyboardType="decimal-pad"
				suffix="%"
			/>
			<TextField
				label="Wealth reached nisab on"
				value={start}
				onChangeText={setStart}
				placeholder="YYYY-MM-DD"
			/>
			{!valid ? (
				<PoText variant="meta13" tone="textDanger">
					Check the amounts, the rate (0–100) and the date (like 2026-03-20).
				</PoText>
			) : null}
		</Sheet>
	);
}

function PaymentSheet({ amount, onClose }: { amount: number; onClose: () => void }) {
	const [to, setTo] = useState("");
	const [note, setNote] = useState("");
	const [value, setValue] = useState(amount > 0 ? String(amount) : "");
	const parsed = parseAmount(value);
	return (
		<Sheet
			visible
			title="Record a payment"
			onClose={onClose}
			action={{
				label: "Save",
				disabled: parsed === null,
				onPress: () => {
					if (parsed === null) return;
					void addPayment({ to: to.trim(), note: note.trim(), amount: parsed }).catch(
						(error: unknown) => console.error("[faith] could not save the payment", error),
					);
					onClose();
				},
			}}
		>
			<TextField label="To" value={to} onChangeText={setTo} placeholder="A family in need" />
			<TextField label="Note" value={note} onChangeText={setNote} placeholder="cash, transfer…" />
			<TextField
				label="Amount"
				value={value}
				onChangeText={setValue}
				keyboardType="numeric"
				suffix="Rs"
			/>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 14, padding: 18, borderRadius: 28, borderWidth: 1 },
	dueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 10,
	},
	barWrap: { paddingTop: 18 },
	nisabLabel: {
		position: "absolute",
		top: 0,
		transform: [{ translateX: -60 }],
		width: 120,
		textAlign: "center",
	},
	bar: { height: 10, flexDirection: "row", gap: 3 },
	nisabMark: { position: "absolute", top: 14, width: 2, height: 18, marginLeft: -1 },
	legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	list: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 16, paddingBottom: 12 },
	initials: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	addRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 48,
		marginTop: 8,
		borderRadius: 24,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	note: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 20 },
});
