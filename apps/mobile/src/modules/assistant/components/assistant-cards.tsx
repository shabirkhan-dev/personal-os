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
	}
}

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
	choice: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
