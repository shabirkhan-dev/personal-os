import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

export type SoonViewProps = { icon: IconName; title: string; body: string; onBack: () => void };

/** A module that is on but has no Home of its own yet. */
export function SoonView({ icon, title, body, onBack }: SoonViewProps) {
	const { colors } = usePoTheme();
	return (
		<Card style={styles.card}>
			<View style={[styles.tile, { backgroundColor: colors.bgSubtle }]}>
				<Icon name={icon} color={colors.textSecondary} />
			</View>
			<PoText variant="title18">{title}</PoText>
			<PoText variant="body15" tone="textSecondary" style={styles.center}>
				{body}
			</PoText>
			<PillButton variant="secondary" label="Back to Overview" onPress={onBack} />
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { alignItems: "center", paddingVertical: 32 },
	tile: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
	center: { textAlign: "center" },
});
