import { textStyles } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { type KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";

const valueStyle = toTextStyle(textStyles.meta13);
const multilineStyle = toTextStyle(textStyles.body15);

/** The grouped "Details" box from the Add application sheet: one editable row per field. */
export function FieldGroup({
	children,
	dimmed = false,
}: {
	children: ReactNode;
	dimmed?: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.group, { backgroundColor: colors.bgSubtle, opacity: dimmed ? 0.5 : 1 }]}>
			{children}
		</View>
	);
}

export type FieldRowProps = {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	keyboardType?: KeyboardTypeOptions;
	editable?: boolean;
	last?: boolean;
};

/** "Company · Northwind Labs" with the value editable in place. */
export function FieldRow({
	label,
	value,
	onChangeText,
	placeholder = "Add",
	keyboardType,
	editable = true,
	last = false,
}: FieldRowProps) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.row,
				!last && { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
			]}
		>
			<PoText variant="row15">{label}</PoText>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.textTertiary}
				keyboardType={keyboardType}
				editable={editable}
				accessibilityLabel={label}
				selectionColor={colors.accentDefault}
				style={[valueStyle, styles.input, { color: colors.textSecondary }]}
			/>
		</View>
	);
}

/** A multi-line text box on bg/subtle (job text, notes, a nudge draft). */
export function TextBox({
	value,
	onChangeText,
	placeholder,
	label,
	minHeight = 120,
	editable = true,
}: {
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	label: string;
	minHeight?: number;
	editable?: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<TextInput
			value={value}
			onChangeText={onChangeText}
			placeholder={placeholder}
			placeholderTextColor={colors.textTertiary}
			multiline
			editable={editable}
			textAlignVertical="top"
			accessibilityLabel={label}
			selectionColor={colors.accentDefault}
			style={[
				multilineStyle,
				styles.box,
				{ minHeight, backgroundColor: colors.bgSubtle, color: colors.textPrimary },
			]}
		/>
	);
}

const styles = StyleSheet.create({
	group: { borderRadius: 24, paddingHorizontal: 16, paddingVertical: 2 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
	input: { flex: 1, textAlign: "right", paddingVertical: 0 },
	box: { borderRadius: 22, padding: 16 },
});
