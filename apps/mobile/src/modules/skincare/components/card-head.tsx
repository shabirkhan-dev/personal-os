import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";

export type CardHeadProps = { title: string; meta: string };

/** Widget title on the left, mono meta on the right ("2 of 4 done"). */
export function CardHead({ title, meta }: CardHeadProps) {
	return (
		<View style={styles.head}>
			<PoText variant="title18" accessibilityRole="header" numberOfLines={1} style={styles.title}>
				{title}
			</PoText>
			<PoText variant="mono13" tone="textSecondary" numberOfLines={1}>
				{meta}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	head: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	title: { flexShrink: 1 },
});
