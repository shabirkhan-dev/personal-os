import type {
	AppLink,
	ApplicationSummary,
	Card as AnswerCard,
	Tone,
} from "@personal-os/domain/assistant";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ListRow } from "@/components/module-ui";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { careerRoutes } from "@/modules/career/navigation";
import { financeRoutes } from "@/modules/finance/navigation";
import { STAGE_LABELS, type Stage } from "@/modules/career/lib/career-model";
import { usePoTheme } from "@/theme";

/** Opens the app screen a card points to. */
export function openLink(link: AppLink) {
	switch (link.screen) {
		case "career":
			careerRoutes.today();
			return;
		case "career-applications":
			careerRoutes.applications();
			return;
		case "career-application":
			careerRoutes.application(link.id);
			return;
		case "career-prep":
			careerRoutes.prep(link.id);
			return;
		case "career-skill":
			careerRoutes.skill();
			return;
		case "finance":
			financeRoutes.today();
			return;
		case "finance-runway":
			financeRoutes.runway();
			return;
		case "finance-budget":
			financeRoutes.budget();
			return;
		case "finance-history":
			financeRoutes.history();
			return;
		case "finance-income":
			financeRoutes.income();
			return;
		case "finance-insights":
			financeRoutes.insights();
			return;
	}
}

/** The fill colour of a tone, for bars and dots. */
const FILL: Record<
	Tone,
	"accentDefault" | "statusSuccess" | "statusCaution" | "statusDanger" | "textTertiary"
> = {
	accent: "accentDefault",
	success: "statusSuccess",
	caution: "statusCaution",
	danger: "statusDanger",
	neutral: "textTertiary",
};

const TONE_COLOR: Record<
	Tone,
	"accentDefault" | "textSuccess" | "textWarning" | "textDanger" | "textPrimary"
> = {
	accent: "accentDefault",
	success: "textSuccess",
	caution: "textWarning",
	danger: "textDanger",
	neutral: "textPrimary",
};

const shortDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** "Senior TS · Applied · follow up Mon 2 Nov" */
function applicationLine(item: ApplicationSummary): string {
	const stage = STAGE_LABELS[item.stage as Stage] ?? item.stage;
	const when = item.interviewAt
		? `interview ${shortDate(item.interviewAt)}`
		: item.followUpAt
			? `follow up ${shortDate(item.followUpAt)}`
			: null;
	return [item.role, stage, when].filter(Boolean).join(" · ");
}

export type CardActions = {
	onDecide: (callId: string, approve: boolean) => void;
	onUndo: (callId: string) => void;
	onChoose: (text: string) => void;
	/** Approvals and choices are only live on the newest answer. */
	live: boolean;
	busy: boolean;
};

/** One card of an answer: the rich part of the reply, drawn with the Kit v2 pieces. */
export function AnswerCardView({ card, actions }: { card: AnswerCard; actions: CardActions }) {
	const { colors } = usePoTheme();
	switch (card.kind) {
		case "stats":
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					<View style={styles.stats}>
						{card.items.map((item) => (
							<View key={item.label} style={[styles.stat, { backgroundColor: colors.bgSubtle }]}>
								<PoText variant="title18" tone={TONE_COLOR[item.tone ?? "neutral"]}>
									{item.value}
								</PoText>
								<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
									{item.label}
								</PoText>
							</View>
						))}
					</View>
				</Card>
			);
		case "records":
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					{card.items.length === 0 ? (
						<PoText variant="meta13" tone="textSecondary">
							{card.empty}
						</PoText>
					) : (
						<View>
							{card.items.map((item, index) => (
								<ListRow
									key={item.id}
									title={item.company}
									subtitle={applicationLine(item)}
									chevron
									last={index === card.items.length - 1 && !card.more}
									onPress={() => careerRoutes.application(item.id)}
								/>
							))}
							{card.more ? (
								<ListRow
									title="See all"
									chevron
									last
									onPress={() => openLink(card.more as AppLink)}
								/>
							) : null}
						</View>
					)}
				</Card>
			);
		case "record":
			return (
				<Card style={styles.tight}>
					<ListRow
						title={card.item.company}
						subtitle={[applicationLine(card.item), card.item.pay, card.item.where]
							.filter(Boolean)
							.join(" · ")}
						chevron
						last
						onPress={() => openLink(card.link)}
					/>
				</Card>
			);
		case "approval": {
			const waiting = card.state === "waiting";
			return (
				<Card style={[styles.tight, waiting ? { borderColor: colors.accentSubtleBorder } : null]}>
					<View style={styles.head}>
						<Icon
							name={
								card.state === "declined" ? "Line/Close" : waiting ? "Filled/Sparkle" : "Line/Check"
							}
							size={16}
							color={card.effect === "risky" && waiting ? colors.textDanger : colors.textSecondary}
						/>
						<PoText variant="eyebrow11" tone="textTertiary">
							{waiting
								? card.effect === "risky"
									? "NEEDS YOUR OK · CAN'T EASILY UNDO"
									: "NEEDS YOUR OK"
								: card.state === "approved"
									? "APPROVED"
									: "NOT DONE"}
						</PoText>
					</View>
					<View style={styles.text}>
						<PoText variant="row15">{card.title}</PoText>
						{card.detail ? (
							<PoText variant="meta13" tone="textSecondary">
								{card.detail}
							</PoText>
						) : null}
					</View>
					{waiting && actions.live ? (
						<View style={styles.buttons}>
							<PillButton
								label="Not now"
								variant="secondary"
								disabled={actions.busy}
								onPress={() => actions.onDecide(card.callId, false)}
							/>
							<PillButton
								label={card.effect === "risky" ? "Yes, do it" : "Approve"}
								disabled={actions.busy}
								onPress={() => {
									haptics.success();
									actions.onDecide(card.callId, true);
								}}
							/>
						</View>
					) : null}
				</Card>
			);
		}
		case "change":
			return (
				<View style={[styles.change, { backgroundColor: colors.bgSubtle }]}>
					<Icon
						name={card.undone ? "Line/Close" : "Line/Check"}
						size={16}
						color={card.undone ? colors.textTertiary : colors.textSuccess}
					/>
					<View style={styles.flex}>
						<PoText variant="text14Medium" tone={card.undone ? "textTertiary" : "textPrimary"}>
							{card.undone ? `Undone: ${card.title}` : card.title}
						</PoText>
						{card.detail && !card.undone ? (
							<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
								{card.detail}
							</PoText>
						) : null}
					</View>
					{card.undone ? null : (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={`Undo: ${card.title}`}
							hitSlop={8}
							onPress={() => {
								haptics.tap();
								actions.onUndo(card.callId);
							}}
							style={[styles.undo, { borderColor: colors.borderDefault }]}
						>
							<PoText variant="meta13">Undo</PoText>
						</Pressable>
					)}
				</View>
			);
		case "link":
			return (
				<Pressable
					accessibilityRole="button"
					onPress={() => {
						haptics.tap();
						openLink(card.link);
					}}
					style={[
						styles.link,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<PoText variant="text14Medium">{card.label}</PoText>
					<Icon name="Line/Chevron right" size={16} color={colors.textSecondary} />
				</Pressable>
			);
		case "metric": {
			const body = (
				<>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.label.toUpperCase()}
					</PoText>
					<PoText variant="title30" tone={TONE_COLOR[card.tone ?? "neutral"]}>
						{card.value}
					</PoText>
					{card.detail ? (
						<PoText variant="meta13" tone="textSecondary">
							{card.detail}
						</PoText>
					) : null}
				</>
			);
			return card.link ? (
				<Pressable accessibilityRole="button" onPress={() => openLink(card.link as AppLink)}>
					<Card style={[styles.tight, styles.metric]}>{body}</Card>
				</Pressable>
			) : (
				<Card style={[styles.tight, styles.metric]}>{body}</Card>
			);
		}
		case "list":
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					{card.items.length === 0 ? (
						<PoText variant="meta13" tone="textSecondary">
							{card.empty}
						</PoText>
					) : (
						<View>
							{card.items.map((item, index) => (
								<ListRow
									key={item.id}
									title={item.title}
									subtitle={item.subtitle}
									value={item.value}
									valueTone={TONE_COLOR[item.tone ?? "neutral"]}
									last={index === card.items.length - 1 && !card.more}
									onPress={item.link ? () => openLink(item.link as AppLink) : undefined}
								/>
							))}
							{card.more ? (
								<ListRow
									title="See all"
									chevron
									last
									onPress={() => openLink(card.more as AppLink)}
								/>
							) : null}
						</View>
					)}
				</Card>
			);
		case "chart": {
			const max = Math.max(1, ...card.points.map((point) => point.value));
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					{card.style === "bars" ? (
						<View style={styles.bars}>
							{card.points.map((point) => (
								<View
									key={point.label}
									style={styles.barRow}
									accessible
									accessibilityLabel={`${point.label}: ${point.display ?? point.value}`}
								>
									<PoText variant="meta13" numberOfLines={1} style={styles.barLabel}>
										{point.label}
									</PoText>
									<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
										<View
											style={[
												styles.fill,
												{
													width: `${Math.max(3, (point.value / max) * 100)}%`,
													backgroundColor: colors[FILL[point.tone ?? "accent"]],
												},
											]}
										/>
									</View>
									<PoText variant="mono13" tone="textSecondary" style={styles.barValue}>
										{point.display ?? String(point.value)}
									</PoText>
								</View>
							))}
						</View>
					) : (
						<View style={styles.columns}>
							{card.points.map((point) => (
								<View
									key={point.label}
									style={styles.column}
									accessible
									accessibilityLabel={`${point.label}: ${point.display ?? point.value}`}
								>
									<View style={styles.columnTrack}>
										<View
											style={[
												styles.columnFill,
												{
													height: `${Math.max(2, (point.value / max) * 100)}%`,
													backgroundColor: colors[FILL[point.tone ?? "accent"]],
												},
											]}
										/>
									</View>
									<PoText variant="tab11" tone="textTertiary" numberOfLines={1}>
										{point.label}
									</PoText>
								</View>
							))}
						</View>
					)}
					{card.note ? (
						<PoText variant="meta13" tone="textSecondary">
							{card.note}
						</PoText>
					) : null}
				</Card>
			);
		}
		case "progress":
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					<View style={styles.bars}>
						{card.items.map((item) => (
							<View
								key={item.label}
								style={styles.progress}
								accessible
								accessibilityLabel={`${item.label}: ${item.text}`}
							>
								<View style={styles.progressHead}>
									<PoText variant="text14Medium">{item.label}</PoText>
									<PoText
										variant="meta13"
										tone={TONE_COLOR[item.tone === "accent" ? "neutral" : (item.tone ?? "neutral")]}
									>
										{item.text}
									</PoText>
								</View>
								<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
									<View
										style={[
											styles.fill,
											{
												width: `${item.limit > 0 ? Math.min(100, Math.max(2, (item.used / item.limit) * 100)) : 100}%`,
												backgroundColor: colors[FILL[item.tone ?? "accent"]],
											},
										]}
									/>
								</View>
							</View>
						))}
					</View>
				</Card>
			);
		case "timeline":
			return (
				<Card style={styles.tight}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{card.title.toUpperCase()}
					</PoText>
					<View>
						{card.items.map((item, index) => (
							<View key={`${item.when}-${index}`} style={styles.step}>
								<View style={styles.rail}>
									<View
										style={[styles.dot, { backgroundColor: colors[FILL[item.tone ?? "accent"]] }]}
									/>
									{index < card.items.length - 1 ? (
										<View style={[styles.line, { backgroundColor: colors.borderDefault }]} />
									) : null}
								</View>
								<View style={styles.stepText}>
									<PoText variant="text14Medium">{item.text}</PoText>
									<PoText variant="meta13" tone="textTertiary">
										{item.when}
									</PoText>
								</View>
							</View>
						))}
					</View>
				</Card>
			);
		case "callout": {
			const subtle =
				card.tone === "danger"
					? colors.statusDangerSubtle
					: card.tone === "caution"
						? colors.statusCautionSubtle
						: card.tone === "success"
							? colors.statusSuccessSubtle
							: colors.accentSubtle;
			return (
				<View style={[styles.callout, { backgroundColor: subtle }]}>
					<PoText variant="text14Medium" tone={TONE_COLOR[card.tone]}>
						{card.title}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{card.text}
					</PoText>
				</View>
			);
		}
		case "choices":
			return actions.live ? (
				<View style={styles.choices}>
					{card.options.map((option) => (
						<Pressable
							key={option}
							accessibilityRole="button"
							disabled={actions.busy}
							onPress={() => {
								haptics.select();
								actions.onChoose(option);
							}}
							style={({ pressed }) => [
								styles.choice,
								{
									borderColor: colors.accentSubtleBorder,
									backgroundColor: pressed ? colors.accentSubtle : colors.bgSurface,
								},
							]}
						>
							<PoText variant="text14Medium" tone="accentDefault">
								{option}
							</PoText>
						</Pressable>
					))}
				</View>
			) : null;
	}
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	tight: { gap: 12, padding: 16, borderRadius: 24 },
	stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	stat: { flexGrow: 1, flexBasis: "45%", gap: 2, padding: 12, borderRadius: 16 },
	head: { flexDirection: "row", alignItems: "center", gap: 6 },
	text: { gap: 2 },
	buttons: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
	change: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16 },
	undo: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
	link: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 999,
		borderWidth: 1,
		alignSelf: "flex-start",
		gap: 8,
	},
	choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	metric: { gap: 4 },
	bars: { gap: 10 },
	barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	barLabel: { width: 84 },
	barValue: { minWidth: 72, textAlign: "right" },
	track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
	fill: { height: 8, borderRadius: 4 },
	columns: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 120 },
	column: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
	columnTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
	columnFill: { width: "100%", borderRadius: 4 },
	progress: { gap: 6 },
	progressHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
	step: { flexDirection: "row", gap: 12 },
	rail: { width: 10, alignItems: "center" },
	dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
	line: { width: 2, flex: 1, marginVertical: 2 },
	stepText: { flex: 1, gap: 2, paddingBottom: 12 },
	callout: { gap: 4, padding: 14, borderRadius: 16 },
	choice: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
