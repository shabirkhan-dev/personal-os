import { textStyles } from "@personal-os/tokens";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { deviceSpeechModule, useVoiceInput } from "@/lib/voice";

/** A chip either fills the bar with its text or runs its own action (opens a sheet). */
export type AskSuggestion = string | { label: string; onPress: () => void };

export type AskBarProps = {
	suggestions: readonly AskSuggestion[];
	/** `spoken` is true when the line came from the mic, so the reply can be spoken too. */
	onSubmit: (text: string, spoken: boolean) => void;
	placeholder?: string;
	/** Starts listening as soon as the bar appears ("Talk to OS" shortcut). */
	autoListen?: boolean;
};

const inputStyle = toTextStyle(textStyles.body15);

/** Kit v2 "Ask Bar" with suggestion chips: one input for logging and asking. */
export function AskBar({
	suggestions,
	onSubmit,
	placeholder = "Log or ask anything…",
	autoListen = false,
}: AskBarProps) {
	const { colors } = usePoTheme();
	const [text, setText] = useState("");
	const voice = useVoiceInput();
	const listening = voice.status === "listening" || voice.status === "starting";
	const shown = listening ? voice.transcript : text;
	const canSend = shown.trim().length > 0;
	const canTalk = deviceSpeechModule !== null && voice.status !== "unavailable";

	const submit = (value = text, spoken = false) => {
		if (!value.trim()) return;
		haptics.tap();
		onSubmit(value.trim(), spoken);
		setText("");
	};

	// Speaking a line sends it as soon as listening stops.
	const heard = useRef(false);
	useEffect(() => {
		if (listening) heard.current = true;
		else if (heard.current && voice.status === "stopped") {
			heard.current = false;
			submit(voice.transcript, true);
		}
		// oxlint-disable-next-line react/exhaustive-deps -- runs on status changes only
	}, [voice.status]);

	const started = useRef(false);
	useEffect(() => {
		if (autoListen && canTalk && !started.current) {
			started.current = true;
			voice.reset();
			void voice.start();
		}
	}, [autoListen, canTalk, voice]);

	const talk = () => {
		haptics.tap();
		if (listening) voice.stop();
		else {
			voice.reset();
			void voice.start();
		}
	};
	const showMic = canTalk && (listening || !canSend);

	return (
		<View style={styles.ask}>
			<View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Filled/Sparkle" color={colors.textSecondary} />
				<TextInput
					value={shown}
					onChangeText={setText}
					onSubmitEditing={() => submit()}
					editable={!listening}
					placeholder={listening ? "Listening…" : placeholder}
					placeholderTextColor={colors.textTertiary}
					returnKeyType="send"
					accessibilityLabel="Log or ask anything"
					style={[inputStyle, styles.input, { color: colors.textPrimary }]}
				/>
				{showMic ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={listening ? "Stop and send" : "Speak instead"}
						onPress={talk}
						style={[
							styles.send,
							{ backgroundColor: listening ? colors.accentDefault : colors.bgSurface },
						]}
					>
						<Icon
							name={listening ? "Line/Check" : "Mic"}
							color={listening ? colors.textInverse : colors.textPrimary}
						/>
					</Pressable>
				) : (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Send"
						accessibilityState={{ disabled: !canSend }}
						disabled={!canSend}
						onPress={() => submit()}
						style={[
							styles.send,
							{ backgroundColor: colors.bgInverse, opacity: canSend ? 1 : 0.45 },
						]}
					>
						<Icon name="Line/Arrow up" color={colors.textInverse} />
					</Pressable>
				)}
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={styles.suggestions}
			>
				{suggestions.map((suggestion) => {
					const label = typeof suggestion === "string" ? suggestion : suggestion.label;
					return (
						<Pressable
							key={label}
							accessibilityRole="button"
							accessibilityHint={typeof suggestion === "string" ? "Fills the ask bar" : undefined}
							onPress={() => {
								haptics.select();
								if (typeof suggestion === "string") setText(suggestion);
								else suggestion.onPress();
							}}
							style={({ pressed }) => [
								styles.chip,
								{
									borderColor: colors.borderDefault,
									backgroundColor: pressed ? colors.bgHover : "transparent",
								},
							]}
						>
							<PoText variant="meta13" tone="textSecondary">
								{label}
							</PoText>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12, paddingBottom: 8 },
	bar: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingLeft: 18,
		paddingRight: 6,
		borderRadius: 26,
	},
	input: { flex: 1, paddingVertical: 0 },
	send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	suggestions: { gap: 8 },
	chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
});
