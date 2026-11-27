import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { usePoTheme } from "@/theme";
import { MOMENT_TITLES, type Moment, type MomentStep } from "../lib/day-moment";

const MOMENT_TONE = {
	morning: { tone: "statusCaution", tile: "statusCautionSubtle" },
	day: { tone: "accentDefault", tile: "accentSubtle" },
	evening: { tone: "statusSuccess", tile: "statusSuccessSubtle" },
	night: { tone: "accentDefault", tile: "accentSubtle" },
} as const;

/**
 * What matters in this part of the day, at the top of Overview: two by two, each with its
 * module's live line ("Next · Asr at 15:42", "Today · Navy and white").
 */
export function MomentCard({
	moment,
	steps,
	status,
	onOpen,
}: {
	moment: Moment;
	steps: readonly MomentStep[];
	status: Partial<Record<ModuleId, string>>;
	onOpen: (module: ModuleId) => void;
}) {
	const { colors } = usePoTheme();
	if (steps.length === 0) return null;
	const { tone, tile } = MOMENT_TONE[moment];
	const head = MOMENT_TITLES[moment];

	const open = (step: MomentStep) => {
		haptics.tap();
		if (step.href) router.push(step.href as Parameters<typeof router.push>[0]);
		else onOpen(step.module);
	};

	return (
		<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{head.title.toUpperCase()}
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{head.line}
				</PoText>
			</View>
			<View style={styles.grid}>
				{steps.map((step) => (
					<Pressable
						key={step.id}
						accessibilityRole="button"
						accessibilityLabel={`${step.title}. ${status[step.module] ?? ""}`}
						onPress={() => open(step)}
						style={({ pressed }) => [
							styles.tile,
							{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
						]}
					>
						<View style={[styles.icon, { backgroundColor: colors[tile] }]}>
							<Icon name={step.icon} size={18} color={colors[tone]} />
						</View>
						<PoText variant="row15" numberOfLines={1}>
							{step.title}
						</PoText>
						<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
							{status[step.module] ?? "Open"}
						</PoText>
					</Pressable>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 14, borderRadius: 22 },
	head: { gap: 2, paddingHorizontal: 4 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	tile: { flexBasis: "47%", flexGrow: 1, gap: 6, padding: 12, borderRadius: 18, minHeight: 112 },
	icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
