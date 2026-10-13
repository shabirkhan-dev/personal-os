import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";

/** Mono label row above a field, with an optional value on the right. */
export function FieldLabel({ label, value }: { label: string; value?: string }) {
	return (
		<View style={styles.row}>
			<PoText variant="eyebrow11" tone="textTertiary">
				{label}
			</PoText>
			{value ? (
				<PoText variant="mono13" tone="textSecondary">
					{value}
				</PoText>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 6,
	},
});
