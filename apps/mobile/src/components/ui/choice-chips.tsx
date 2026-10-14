import { Pressable, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type ChoiceChipsProps<T extends string> = {
	label?: string;
	options: readonly { value: T; label: string }[];
	value: T | null;
	onChange: (value: T) => void;
};

/** A wrapping row of pill choices (category, meal type…). */
export function ChoiceChips<T extends string>({
	label,
	options,
	value,
	onChange,
}: ChoiceChipsProps<T>) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.group}>
			{label ? (
				<PoText variant="meta13" tone="textSecondary">
					{label}
				</PoText>
			) : null}
			<View style={styles.row}>
				{options.map((option) => {
					const selected = option.value === value;
					return (
						<Pressable
							key={option.value}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							onPress={() => {
								haptics.select();
								onChange(option.value);
							}}
							style={[
								styles.chip,
								selected
									? { backgroundColor: colors.bgInverse, borderColor: colors.bgInverse }
									: { backgroundColor: colors.bgSubtle, borderColor: colors.borderDefault },
							]}
						>
							<PoText variant="meta13" tone={selected ? "textInverse" : "textSecondary"}>
								{option.label}
							</PoText>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	group: { gap: 6 },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
});
