import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

export type SheetOption<T extends string> = { value: T; label: string; detail?: string };

export type OptionSheetProps<T extends string> = {
	visible: boolean;
	title: string;
	options: readonly SheetOption<T>[];
	value: T;
	onChange: (value: T) => void;
	onClose: () => void;
	/** Quiet line under the options ("More currencies soon"). */
	note?: string;
};

/** A sheet with a single choice; picking an option applies it and closes the sheet. */
export function OptionSheet<T extends string>({
	visible,
	title,
	options,
	value,
	onChange,
	onClose,
	note,
}: OptionSheetProps<T>) {
	const { colors } = usePoTheme();
	return (
		<Sheet visible={visible} title={title} onClose={onClose}>
			<View accessibilityRole="radiogroup" style={styles.list}>
				{options.map((option) => {
					const selected = option.value === value;
					return (
						<Pressable
							key={option.value}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							accessibilityLabel={[option.label, option.detail].filter(Boolean).join(", ")}
							onPress={() => {
								haptics.select();
								onChange(option.value);
								onClose();
							}}
							style={({ pressed }) => [
								styles.option,
								{
									backgroundColor: selected || pressed ? colors.bgSelected : colors.bgSubtle,
									borderColor: selected ? colors.accentDefault : colors.borderDefault,
								},
							]}
						>
							<View style={styles.text}>
								<PoText variant="row15">{option.label}</PoText>
								{option.detail ? (
									<PoText variant="meta13" tone="textSecondary">
										{option.detail}
									</PoText>
								) : null}
							</View>
							{selected ? <Icon name="Line/Check" color={colors.accentDefault} /> : null}
						</Pressable>
					);
				})}
			</View>
			{note ? (
				<PoText variant="meta13" tone="textTertiary">
					{note}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	list: { gap: 8 },
	option: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		minHeight: 56,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		borderWidth: 1,
	},
	text: { flex: 1, gap: 2 },
});
