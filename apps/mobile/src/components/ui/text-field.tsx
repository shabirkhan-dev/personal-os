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
					{
						backgroundColor: colors.bgSubtle,
						borderColor: focused ? colors.accentDefault : colors.borderDefault,
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
	group: { gap: 6 },
	field: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		borderRadius: 16,
		borderWidth: 1,
	},
	input: { flex: 1, paddingVertical: 0 },
});
