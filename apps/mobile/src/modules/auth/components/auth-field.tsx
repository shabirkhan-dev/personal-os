import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";

interface AuthFieldProps {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	secureTextEntry?: boolean;
	showPasswordToggle?: boolean;
	onTogglePassword?: () => void;
	keyboardType?: "default" | "email-address" | "number-pad";
	autoComplete?: TextInput["props"]["autoComplete"];
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	editable?: boolean;
	hint?: string;
	errorHint?: string;
	maxLength?: number;
	multiline?: boolean;
	numberOfLines?: number;
	rightLink?: { label: string; onPress: () => void };
}

export function AuthField({
	label,
	value,
	onChangeText,
	placeholder,
	secureTextEntry,
	showPasswordToggle,
	onTogglePassword,
	keyboardType = "default",
	autoComplete,
	autoCapitalize = "none",
	editable = true,
	hint,
	errorHint,
	maxLength,
	multiline = false,
	numberOfLines,
	rightLink,
}: AuthFieldProps) {
	const { colors, isDark } = useTheme();

	return (
		<View style={styles.field}>
			<View style={styles.labelRow}>
				<Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
				{rightLink ? (
					<Pressable onPress={rightLink.onPress} hitSlop={8}>
						<Text style={[styles.link, { color: colors.accent.green }]}>{rightLink.label}</Text>
					</Pressable>
				) : null}
			</View>
			<View
				style={[
					styles.inputWrap,
					{
						borderColor: errorHint ? colors.accent.red : colors.card.border,
						backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
					},
					multiline && styles.inputWrapMultiline,
				]}
			>
				<TextInput
					style={[
						styles.input,
						{
							color: colors.text.primary,
						},
						multiline && styles.inputMultiline,
					]}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.text.muted}
					secureTextEntry={secureTextEntry}
					keyboardType={keyboardType}
					autoComplete={autoComplete}
					autoCapitalize={autoCapitalize}
					editable={editable}
					maxLength={maxLength}
					multiline={multiline}
					numberOfLines={numberOfLines}
					textAlignVertical={multiline ? "top" : "center"}
				/>
				{showPasswordToggle ? (
					<Pressable onPress={onTogglePassword} hitSlop={8} style={styles.eye}>
						{secureTextEntry ? (
							<Icon icon={ViewIcon} size={18} color={colors.text.secondary} />
						) : (
							<Icon icon={ViewOffIcon} size={18} color={colors.text.secondary} />
						)}
					</Pressable>
				) : null}
			</View>
			{errorHint ? (
				<Text style={[styles.errorHint, { color: colors.accent.red }]}>{errorHint}</Text>
			) : null}
			{!errorHint && hint ? (
				<Text style={[styles.hint, { color: colors.text.muted }]}>{hint}</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	field: {
		gap: 8,
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
	},
	link: {
		fontSize: 13,
		fontWeight: "500",
	},
	inputWrap: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		minHeight: 48,
	},
	inputWrapMultiline: {
		alignItems: "flex-start",
		minHeight: 112,
		paddingVertical: 4,
	},
	input: {
		flex: 1,
		fontSize: 16,
		paddingVertical: 12,
	},
	inputMultiline: {
		minHeight: 96,
		paddingTop: 12,
	},
	eye: {
		paddingLeft: 8,
	},
	hint: {
		fontSize: 12,
	},
	errorHint: {
		fontSize: 12,
	},
});
