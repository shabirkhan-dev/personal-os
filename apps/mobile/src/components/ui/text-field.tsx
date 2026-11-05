import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { type KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";

export type TextFieldProps = {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	keyboardType?: KeyboardTypeOptions;
	/** Shown after the input, e.g. "kcal" or "Rs". */
	suffix?: string;
	onSubmitEditing?: () => void;
	/** A few lines of text, like a recipe step or a note. */
	multiline?: boolean;
};

const inputStyle = toTextStyle(textStyles.body15);

/** Labelled single-line input used in sheets. */
export function TextField({
	label,
	value,
	onChangeText,
	placeholder,
	keyboardType,
	suffix,
	onSubmitEditing,
	multiline = false,
}: TextFieldProps) {
	const { colors } = usePoTheme();
	const [focused, setFocused] = useState(false);

	return (
		<View style={styles.group}>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<View
				style={[
					styles.field,
					multiline ? styles.tall : null,
					{
						backgroundColor: focused ? colors.accentSubtle : colors.bgSubtle,
					},
				]}
			>
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.textTertiary}
					keyboardType={keyboardType}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onSubmitEditing={onSubmitEditing}
					multiline={multiline}
					textAlignVertical={multiline ? "top" : "center"}
					selectionColor={colors.accentDefault}
					accessibilityLabel={label}
					style={[inputStyle, styles.input, { color: colors.textPrimary }]}
				/>
				{suffix ? (
					<PoText variant="meta13" tone="textTertiary">
						{suffix}
					</PoText>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	group: { gap: 8 },
	field: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		borderRadius: 16,
	},
	tall: { height: undefined, minHeight: 88, alignItems: "flex-start", paddingVertical: 12 },
	input: { flex: 1, minWidth: 0, paddingVertical: 0 },
});
