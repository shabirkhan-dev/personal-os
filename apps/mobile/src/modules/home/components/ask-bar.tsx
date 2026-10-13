import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";

export type AskBarProps = {
	suggestions: readonly string[];
	onSubmit: (text: string) => void;
};

const inputStyle = toTextStyle(textStyles.body15);

/** Kit v2 "Ask Bar" with suggestion chips: one input for logging and asking. */
export function AskBar({ suggestions, onSubmit }: AskBarProps) {
	const { colors } = usePoTheme();
	const [text, setText] = useState("");
	const canSend = text.trim().length > 0;

	const submit = () => {
		if (!canSend) return;
		onSubmit(text.trim());
		setText("");
	};

	return (
		<View style={styles.ask}>
			<View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Filled/Sparkle" color={colors.textSecondary} />
				<TextInput
					value={text}
					onChangeText={setText}
					onSubmitEditing={submit}
					placeholder="Log or ask anything…"
					placeholderTextColor={colors.textTertiary}
					returnKeyType="send"
					accessibilityLabel="Log or ask anything"
					style={[inputStyle, styles.input, { color: colors.textPrimary }]}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Send"
					accessibilityState={{ disabled: !canSend }}
					disabled={!canSend}
					onPress={submit}
					style={[styles.send, { backgroundColor: colors.bgInverse, opacity: canSend ? 1 : 0.45 }]}
				>
					<Icon name="Line/Arrow up" color={colors.textInverse} />
				</Pressable>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={styles.suggestions}
			>
				{suggestions.map((suggestion) => (
					<Pressable
						key={suggestion}
						accessibilityRole="button"
						accessibilityHint="Fills the ask bar"
						onPress={() => setText(suggestion)}
						style={({ pressed }) => [
							styles.chip,
							{
								borderColor: colors.borderDefault,
								backgroundColor: pressed ? colors.bgHover : "transparent",
							},
						]}
					>
						<PoText variant="meta13" tone="textSecondary">
							{suggestion}
						</PoText>
					</Pressable>
				))}
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
