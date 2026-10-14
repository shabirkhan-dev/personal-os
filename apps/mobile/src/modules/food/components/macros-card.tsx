import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { formatKcal, type Macros } from "../lib/meals";
import { progress } from "../lib/targets";

type MacroCellProps = {
	label: string;
	eaten: number;
	target: number;
	tone: keyof ColorTokens;
};

function MacroCell({ label, eaten, target, tone }: MacroCellProps) {
	const { colors } = usePoTheme();
	const share = progress(eaten, target);
	return (
		<View
			style={styles.cell}
			accessible
			accessibilityLabel={`${label} ${Math.round(eaten)} of ${target} grams`}
		>
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
			<View style={styles.number}>
				<PoText variant="title18">{Math.round(eaten)}</PoText>
				<PoText variant="meta13" tone="textTertiary">
					/ {target} g
				</PoText>
			</View>
			<View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
				<View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: colors[tone] }]} />
			</View>
		</View>
	);
}

export type MacrosCardProps = { eaten: Macros; targets: Macros };

/** Figma "Macros": eaten vs target for protein, carbs and fat, and the calories left. */
export function MacrosCard({ eaten, targets }: MacrosCardProps) {
	const left = targets.kcal - eaten.kcal;
	return (
		<Card style={styles.card}>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Macros
				</PoText>
				<PoText variant="mono13" tone={left < 0 ? "textDanger" : "textSecondary"}>
					{left < 0 ? `${formatKcal(-left)} kcal over` : `${formatKcal(left)} kcal left`}
				</PoText>
			</View>
			<View style={styles.row}>
				<MacroCell
					label="Protein"
					eaten={eaten.protein}
					target={targets.protein}
					tone="statusDanger"
				/>
				<MacroCell label="Carbs" eaten={eaten.carbs} target={targets.carbs} tone="statusCaution" />
				<MacroCell label="Fat" eaten={eaten.fat} target={targets.fat} tone="statusViolet" />
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
	head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
	row: { flexDirection: "row", gap: 14 },
	cell: { flex: 1, gap: 6 },
	number: { flexDirection: "row", alignItems: "baseline", gap: 3 },
	bar: { height: 4, borderRadius: 2, overflow: "hidden" },
	fill: { height: 4, borderRadius: 2 },
});
