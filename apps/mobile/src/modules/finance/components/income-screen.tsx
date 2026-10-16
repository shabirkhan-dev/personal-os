import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import {
	deleteSource,
	ensureSource,
	giveAwayInterest,
	logIncome,
	saveSource,
} from "../data/finance-actions";
import { FINANCE_ASK_JOB, useFinanceUi } from "../hooks/finance-ui-store";
import { useFinanceAsk } from "../hooks/use-finance-ask";
import { useFinanceToday } from "../hooks/use-finance";
import { interestOwed, MONTHS, rupees, sourceTotals } from "../lib/finance-math";
import type { Source } from "../lib/finance-model";
import { AnswerCard, ButtonPair, Card, CardHead, Eyebrow } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";
import { IncomeSheet, OfferSheet } from "./finance-sheets";

const ASK_STEPS = ["Reading the offer", "Checking it for interest", "Writing an answer"] as const;

/** The person's own lines; shown as written, never enforced. */
const RULES: readonly { label: string; value: string; tone: "textDanger" | "textPrimary" }[] = [
	{ label: "Loans with interest", value: "Never", tone: "textDanger" },
	{ label: "Instalments with markup", value: "Never", tone: "textDanger" },
	{ label: "Job offers", value: "Halal check first", tone: "textPrimary" },
	{ label: "Investing", value: "Later · halal funds only", tone: "textPrimary" },
];

function Badge({ halal }: { halal: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.badge,
				{ backgroundColor: halal ? colors.statusSuccessSubtle : colors.statusCautionSubtle },
			]}
		>
			<PoText variant="meta13" tone={halal ? "textSuccess" : "textWarning"}>
				{halal ? "Halal" : "Give away"}
			</PoText>
		</View>
	);
}

function lastLine(source: Source, lastAt: string | null): string {
	if (source.note) return source.note;
	if (!lastAt) return "Nothing yet";
	const date = new Date(lastAt);
	return `Last in ${MONTHS[date.getMonth()]?.slice(0, 3)}`;
}

/** Finance · Income and halal: where money comes from, interest to give away, the rules. */
export function IncomeScreen() {
	const { data, now } = useFinanceToday();
	const { entries, sources } = data;
	const ui = useFinanceUi();
	const askJob = useAiJobs((state) => state.jobs[FINANCE_ASK_JOB]);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [adding, setAdding] = useState(false);
	const [offer, setOffer] = useState(false);
	const [editing, setEditing] = useState<Source | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const ask = useFinanceAsk(setNotice);
	const totals = sourceTotals(entries, sources, now);
	const owed = interestOwed(entries);

	const failed = (error: unknown) => {
		console.error("[finance] could not save income", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	return (
		<FinanceScreen>
			<ScreenTitle eyebrow="Clean money only" title="Income and halal" />
			<Card>
				<CardHead title="Where money comes from" right="last 90 days" mono />
				{totals.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary">
						Add income once and where it came from shows here, with interest kept apart.
					</PoText>
				) : (
					totals.map((item) => (
						<Pressable
							key={item.source.id}
							accessibilityRole="button"
							onPress={() => setEditing(item.source)}
							style={styles.source}
						>
							<View style={styles.flex}>
								<View style={styles.sourceHead}>
									<PoText variant="row15">{item.source.name}</PoText>
									<Badge halal={item.source.halal} />
								</View>
								<PoText variant="meta13" tone="textTertiary">
									{lastLine(item.source, item.lastAt)}
								</PoText>
							</View>
							<PoText variant="row15">{rupees(item.amount)}</PoText>
						</Pressable>
					))
				)}
			</Card>
			{owed > 0 ? (
				<Card tone={{ bg: "statusCautionSubtle", border: "statusWarningBorder" }}>
					<Eyebrow tone="textWarning">Interest found</Eyebrow>
					<PoText variant="body15">
						{`${rupees(owed)} of interest came in. Give it away without counting it as sadqa, then move to a profit-sharing account.`}
					</PoText>
					<PillButton
						label="Mark as given away"
						onPress={() => {
							void giveAwayInterest(owed)
								.then(() => haptics.success())
								.catch(failed);
						}}
					/>
				</Card>
			) : null}
			<Card>
				<CardHead title="Your money rules" />
				{RULES.map((rule) => (
					<View key={rule.label} style={styles.rule}>
						<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
							{rule.label}
						</PoText>
						<PoText variant="row15" tone={rule.tone}>
							{rule.value}
						</PoText>
					</View>
				))}
			</Card>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
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
			<ButtonPair
				secondary={{ label: "Add income", onPress: () => setAdding(true) }}
				primary={{ label: "Check an offer", onPress: () => setOffer(true) }}
			/>
			<IncomeSheet
				visible={adding}
				sources={sources}
				onClose={() => setAdding(false)}
				onSave={(value) => {
					const source = value.newSource
						? ensureSource(value.newSource, value.clean)
						: Promise.resolve(sources.find((item) => item.id === value.sourceId) ?? null);
					void source
						.then((found) =>
							logIncome({
								amount: value.amount,
								title: value.title || found?.name || "Income",
								source: found,
								clean: value.clean,
							}),
						)
						.then(() => haptics.success())
						.catch(failed);
					setAdding(false);
				}}
			/>
			<OfferSheet
				visible={offer}
				onClose={() => setOffer(false)}
				onCheck={(text) => {
					setOffer(false);
					ask(
						`Is this halal for me and what does it do to my runway? No interest, no markup instalments. The offer: ${text}`,
						false,
					);
				}}
			/>
			<SourceSheet
				source={editing}
				onClose={() => setEditing(null)}
				onSave={(source) => {
					void saveSource(source).catch(failed);
					setEditing(null);
				}}
				onDelete={(source) => {
					void deleteSource(source).catch(failed);
					setEditing(null);
				}}
			/>
		</FinanceScreen>
	);
}

/** Rename a source, add a note, or mark it as interest-paying. */
function SourceSheet({
	source,
	onClose,
	onSave,
	onDelete,
}: {
	source: Source | null;
	onClose: () => void;
	onSave: (source: Source) => void;
	onDelete: (source: Source) => void;
}) {
	const [name, setName] = useState("");
	const [note, setNote] = useState("");
	const [halal, setHalal] = useState(true);
	useEffect(() => {
		if (!source) return;
		setName(source.name);
		setNote(source.note);
		setHalal(source.halal);
	}, [source]);
	if (!source) return null;
	return (
		<Sheet
			visible
			title={source.name}
			onClose={onClose}
			footer={
				<View style={styles.pair}>
					<PillButton
						label="Delete"
						variant="secondary"
						style={styles.flex}
						onPress={() => onDelete(source)}
					/>
					<PillButton
						label="Save"
						style={styles.flex}
						onPress={() =>
							onSave({ ...source, name: name.trim() || source.name, note: note.trim(), halal })
						}
					/>
				</View>
			}
		>
			<View style={styles.sheet}>
				<TextField label="Name" value={name} onChangeText={setName} />
				<TextField
					label="Note"
					value={note}
					onChangeText={setNote}
					placeholder="Frontend lead · ended Sep"
				/>
				<View style={styles.chips}>
					<FilterChip label="Halal" selected={halal} onPress={() => setHalal(true)} />
					<FilterChip label="Pays interest" selected={!halal} onPress={() => setHalal(false)} />
				</View>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	source: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
	sourceHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
	rule: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8 },
	sheet: { gap: 12 },
	chips: { flexDirection: "row", gap: 6 },
	pair: { flexDirection: "row", gap: 10 },
});
