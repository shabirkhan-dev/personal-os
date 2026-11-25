import { Pressable, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";

/** A setting with a switch: tapping anywhere on the row flips it, not only the switch. */
export function ToggleRow({
	title,
	meta,
	value,
	onChange,
}: {
	title: string;
	meta?: string | null;
	value: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<View style={styles.row}>
			<Pressable
				accessibilityRole="switch"
				accessibilityState={{ checked: value }}
				onPress={() => {
					haptics.select();
					onChange(!value);
				}}
				style={styles.text}
			>
				<PoText variant="row15">{title}</PoText>
				{meta ? (
					<PoText variant="meta13" tone="textTertiary">
						{meta}
					</PoText>
				) : null}
			</Pressable>
			<Toggle value={value} onChange={onChange} accessibilityLabel={title} />
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	text: { flex: 1, minWidth: 0, gap: 2 },
});
