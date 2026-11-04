import type { ThreadMessage } from "@personal-os/domain/assistant";
import { textStyles } from "@personal-os/tokens";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { deviceSpeechModule, useVoiceInput, voiceOut } from "@/lib/voice";
import { toTextStyle, usePoTheme } from "@/theme";
import { type AssistantPlace, useAssistant } from "../hooks/use-assistant";
import { AnswerCardView, type CardActions } from "./assistant-cards";

/** Starters for an empty chat, fitted to where it was opened. */
function starters(place: AssistantPlace): string[] {
	if (place.module === "career" && place.recordId) {
		return [
			"What's the status here?",
			"Book an interview for this",
			"I sent a follow-up",
			"Move this to closed",
		];
	}
	if (place.module === "faith") {
		return [
			"How are my prayers today?",
			"Prayed fajr and isha",
			"Read Quran for 15 minutes",
			"How much zakat is left?",
		];
	}
	if (place.module === "fashion") {
		return [
			"What haven't I worn lately?",
			"Wore my navy oxford and chinos",
			"What's on my wish list?",
			"What colours do I own?",
		];
	}
	if (place.module === "wishlist") {
		return [
			"When can I get my next dream?",
			"Add a new dream",
			"What am I saving for?",
			"I got the headphones",
		];
	}
	if (place.module === "calendar") {
		return [
			"What's on this week?",
			"Am I free Thursday?",
			"Add dinner with family Friday 8 pm",
			"What bills are due?",
		];
	}
	if (place.module === "skincare") {
		return [
			"What's left in my routine?",
			"Did my morning routine",
			"Is my skin getting better?",
			"What do I need to reorder?",
		];
	}
	if (place.module === "food") {
		return [
			"What have I eaten today?",
			"How much protein is left?",
			"Had 2 eggs and a paratha",
			"How's my week of eating?",
		];
	}
	if (place.module === "workout") {
		return [
			"How's my training this week?",
			"How are my pull-ups going?",
			"I ran 5 km in 28 minutes",
			"When did I last box?",
		];
	}
	if (place.module === "finance") {
		return [
			"How am I doing for money?",
			"Where did my money go this month?",
			"I spent 1200 on lunch",
			"Which bills are due?",
		];
	}
	if (place.module === "career") {
		return [
			"How's my job hunt going?",
			"Which follow-ups are due?",
			"I applied to a new job",
			"When's my next interview?",
		];
	}
	return [
		"How am I doing for money?",
		"How's my job hunt going?",
		"I spent 1200 on lunch",
		"What can you do?",
	];
}

/** A line with **bold** spans. */
function Inline({ text }: { text: string }) {
	const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
	return (
		<PoText variant="body15">
			{parts.map((part, index) =>
				part.startsWith("**") && part.endsWith("**") ? (
					<PoText key={index} variant="body15" style={styles.bold}>
						{part.slice(2, -2)}
					</PoText>
				) : (
					part
				),
			)}
		</PoText>
	);
}

/** Answer text: paragraphs, "- " bullets and **bold**, the formatting answers use. */
function RichText({ text }: { text: string }) {
	const { colors } = usePoTheme();
	const blocks = text.split(/\n+/).filter((line) => line.trim());
	return (
		<View style={styles.paragraphs}>
			{blocks.map((line, index) => {
				const bullet = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/.exec(line);
				return bullet ? (
					<View key={index} style={styles.bullet}>
						<View style={[styles.bulletDot, { backgroundColor: colors.textTertiary }]} />
						<View style={styles.flex}>
							<Inline text={bullet[1] ?? ""} />
						</View>
					</View>
				) : (
					<Inline key={index} text={line.trim()} />
				);
			})}
		</View>
	);
}

function Steps({ steps }: { steps: ThreadMessage["steps"] }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.steps}>
			{steps.map((step) => (
				<View key={step.callId} style={styles.step}>
					{step.status === "running" ? (
						<ActivityIndicator size="small" color={colors.textTertiary} />
					) : (
						<Icon
							name={step.status === "failed" ? "Line/Close" : "Line/Check"}
							size={14}
							color={step.status === "failed" ? colors.textWarning : colors.textTertiary}
						/>
					)}
					<PoText variant="meta13" tone="textTertiary">
						{step.status === "failed" ? `${step.label} (didn't work)` : step.label}
					</PoText>
				</View>
			))}
		</View>
	);
}

function Message({
	message,
	actions,
	thinking,
}: {
	message: ThreadMessage;
	actions: CardActions;
	thinking: boolean;
}) {
	const { colors } = usePoTheme();
	if (message.role === "user") {
		return (
			<View style={[styles.user, { backgroundColor: colors.bgInverse }]}>
				<PoText variant="body15" tone="textInverse">
					{message.text}
				</PoText>
			</View>
		);
	}
	const empty = !message.text && message.cards.length === 0 && message.steps.length === 0;
	return (
		<View style={styles.answer}>
			{message.steps.length > 0 ? <Steps steps={message.steps} /> : null}
			{message.text ? <RichText text={message.text.trim()} /> : null}
			{empty && thinking ? (
				<View style={styles.step}>
					<ActivityIndicator size="small" color={colors.textTertiary} />
					<PoText variant="meta13" tone="textTertiary">
						Thinking
					</PoText>
				</View>
			) : null}
			{message.cards.map((card, index) => (
				<AnswerCardView
					key={`${card.kind}-${"callId" in card ? card.callId : index}`}
					card={card}
					actions={actions}
				/>
			))}
		</View>
	);
}

/**
 * The conversation: answers stream in with their steps and cards, approvals wait on their card,
 * and the box at the bottom sends. Used full screen and inside the in-screen sheet.
 */
export function AssistantChat() {
	const { colors } = usePoTheme();
	const assistant = useAssistant();
	const { conversation, status, error, place } = assistant;
	const [draft, setDraft] = useState("");
	const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
	const thinking = status === "thinking";

	const messages = conversation.messages;
	const voice = useVoiceInput();
	const listening = voice.status === "listening" || voice.status === "starting";
	const canTalk = deviceSpeechModule !== null && voice.status !== "unavailable";
	const shown = listening ? voice.transcript : draft;
	/** True while the answer to a spoken question is coming, so it is read aloud when done. */
	const speakAnswer = useRef(false);

	const send = (text: string, spoken = false) => {
		if (!text.trim() || thinking) return;
		haptics.tap();
		speakAnswer.current = spoken;
		assistant.send(text);
		setDraft("");
	};

	// A spoken question goes out as soon as listening stops.
	const heard = useRef(false);
	useEffect(() => {
		if (listening) heard.current = true;
		else if (heard.current && voice.status === "stopped") {
			heard.current = false;
			send(voice.transcript, true);
		}
		// oxlint-disable-next-line react/exhaustive-deps -- runs on status changes only
	}, [voice.status]);

	// ...and its answer is read back once it has finished streaming.
	useEffect(() => {
		if (status !== "idle" || !speakAnswer.current) return;
		speakAnswer.current = false;
		const answer = messages.at(-1);
		const text = answer?.role === "assistant" ? answer.text.replace(/\*\*/g, "").trim() : "";
		if (text) voiceOut.speak(text);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when an answer finishes
	}, [status]);

	const talk = () => {
		haptics.tap();
		if (listening) voice.stop();
		else {
			voiceOut.stop();
			voice.reset();
			void voice.start();
		}
	};
	const showMic = canTalk && (listening || !draft.trim()) && !thinking;

	return (
		<View style={styles.root}>
			<ScrollView
				ref={scroll}
				style={styles.root}
				// Follows the answer as it streams in.
				onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
				contentContainerStyle={styles.list}
				keyboardShouldPersistTaps="handled"
			>
				{messages.length === 0 ? (
					<View style={styles.empty}>
						<View style={[styles.spark, { backgroundColor: colors.accentSubtle }]}>
							<Icon name="Filled/Sparkle" size={22} color={colors.accentDefault} />
						</View>
						<PoText variant="title18">What can I do for you?</PoText>
						<PoText variant="meta13" tone="textSecondary" style={styles.center}>
							I can see every part of your day: money, food, training, care, prayers, your job hunt,
							wardrobe, wishlist and calendar. I ask before changing anything.
						</PoText>
						<View style={styles.starters}>
							{starters(place).map((text) => (
								<Pressable
									key={text}
									accessibilityRole="button"
									onPress={() => send(text)}
									style={({ pressed }) => [
										styles.starter,
										{
											backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
										},
									]}
								>
									<PoText variant="text14">{text}</PoText>
								</Pressable>
							))}
						</View>
					</View>
				) : (
					messages.map((message, index) => (
						<Message
							key={message.id}
							message={message}
							thinking={thinking && index === messages.length - 1}
							actions={{
								live: index >= messages.length - 2,
								busy: thinking,
								onDecide: assistant.decide,
								onUndo: (callId) => void assistant.undo(callId),
								onChoose: send,
							}}
						/>
					))
				)}
				{error ? (
					<View style={[styles.error, { backgroundColor: colors.statusCautionSubtle }]}>
						<PoText variant="meta13" tone="textWarning">
							{error}
						</PoText>
					</View>
				) : null}
			</ScrollView>
			<View style={[styles.composer, { backgroundColor: colors.bgSurface }]}>
				<TextInput
					value={shown}
					onChangeText={setDraft}
					editable={!listening}
					placeholder={
						listening
							? "Listening…"
							: status === "waiting"
								? "Or tell me something else…"
								: "Ask or tell me anything…"
					}
					placeholderTextColor={colors.textTertiary}
					multiline
					accessibilityLabel="Message the assistant"
					style={[styles.input, { color: colors.textPrimary }]}
					onSubmitEditing={() => send(draft)}
					submitBehavior="submit"
					returnKeyType="send"
				/>
				{showMic ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={listening ? "Stop and send" : "Speak instead"}
						onPress={talk}
						style={[
							styles.send,
							{ backgroundColor: listening ? colors.accentDefault : colors.bgSubtle },
						]}
					>
						<Icon
							name={listening ? "Line/Check" : "Mic"}
							size={18}
							color={listening ? colors.textOnAccent : colors.textPrimary}
						/>
					</Pressable>
				) : (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Send"
						disabled={!draft.trim() || thinking}
						onPress={() => send(draft)}
						style={[
							styles.send,
							{
								backgroundColor: draft.trim() && !thinking ? colors.accentDefault : colors.bgSubtle,
							},
						]}
					>
						{thinking ? (
							<ActivityIndicator size="small" color={colors.textSecondary} />
						) : (
							<Icon
								name="Line/Arrow up"
								size={18}
								color={draft.trim() ? colors.textOnAccent : colors.textTertiary}
							/>
						)}
					</Pressable>
				)}
			</View>
			{voice.status === "denied" ? (
				<Pressable accessibilityRole="button" onPress={voice.openSettings} style={styles.denied}>
					<PoText variant="meta13" tone="textWarning">
						Allow the microphone in Settings to talk to the assistant.
					</PoText>
				</Pressable>
			) : null}
		</View>
	);
}

const medium = toTextStyle(textStyles.text14Medium);

const styles = StyleSheet.create({
	root: { flex: 1 },
	denied: { paddingTop: 8, paddingHorizontal: 6 },
	list: { gap: 16, paddingVertical: 12, flexGrow: 1 },
	empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 24 },
	spark: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	center: { textAlign: "center", maxWidth: 320 },
	starters: { gap: 8, alignSelf: "stretch", marginTop: 8 },
	starter: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
	user: {
		alignSelf: "flex-end",
		maxWidth: "85%",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 20,
		borderBottomRightRadius: 6,
	},
	answer: { gap: 10 },
	// The medium weight of the type scale, at the body size.
	bold: { fontFamily: medium.fontFamily, fontWeight: medium.fontWeight },
	paragraphs: { gap: 8 },
	bullet: { flexDirection: "row", gap: 10, paddingLeft: 2 },
	bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
	flex: { flex: 1 },
	steps: { gap: 4 },
	step: { flexDirection: "row", alignItems: "center", gap: 6 },
	error: { padding: 12, borderRadius: 14 },
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
		paddingLeft: 16,
		paddingRight: 6,
		paddingVertical: 6,
		borderRadius: 20,
		marginTop: 8,
	},
	input: { ...toTextStyle(textStyles.body15), flex: 1, maxHeight: 120, paddingVertical: 8 },
	send: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
