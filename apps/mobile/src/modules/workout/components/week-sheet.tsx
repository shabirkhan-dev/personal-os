import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { clock, dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatThousands } from "../lib/kcal";
import { DAILY_TARGET_MIN, type WeekBar } from "../lib/score";
import type { WorkoutSession } from "../lib/types";
import { removeSession } from "../store/workout-store";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type WeekSheetProps = {
	visible: boolean;
	bars: readonly WeekBar[];
	sessions: readonly WorkoutSession[];
	onClose: () => void;
};

/** This week day by day: minutes against the target and each logged session. */
export function WeekSheet({ visible, bars, sessions, onClose }: WeekSheetProps) {
	const active = bars.filter((bar) => bar.minutes > 0).length;
	return (
		<Sheet visible={visible} title="This week" onClose={onClose}>
			<PoText variant="meta13" tone="textSecondary">
				{`${active} active day${active === 1 ? "" : "s"} · target ${DAILY_TARGET_MIN} min a day`}
			</PoText>
			{bars
				.filter((bar) => !bar.isFuture)
				.map((bar, index) => (
					<DayBlock
						key={bar.key}
						name={DAY_NAMES[index] ?? ""}
						bar={bar}
						sessions={sessions.filter((item) => dayKey(new Date(item.startedAt)) === bar.key)}
					/>
				))}
		</Sheet>
	);
}

type DayBlockProps = { name: string; bar: WeekBar; sessions: readonly WorkoutSession[] };

function DayBlock({ name, bar, sessions }: DayBlockProps) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.day}>
			<View style={styles.dayHead}>
				<PoText variant="row15">{bar.isToday ? "Today" : name}</PoText>
				<PoText variant="mono13" tone={bar.ratio >= 1 ? "textSuccess" : "textTertiary"}>
					{`${bar.minutes} / ${DAILY_TARGET_MIN} min`}
				</PoText>
			</View>
			{sessions.length === 0 ? (
				<PoText variant="meta13" tone="textTertiary">
					Nothing logged
				</PoText>
			) : (
				sessions.map((session) => (
					<View key={session.id} style={[styles.row, { borderColor: colors.borderDefault }]}>
						<View style={styles.rowText}>
							<PoText variant="text14">{session.title}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{`${clock(new Date(session.startedAt))} · ${session.durationMin} min · ${formatThousands(session.kcal)} kcal`}
							</PoText>
						</View>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={`Remove ${session.title}`}
							hitSlop={10}
							onPress={() => {
								haptics.tap();
								Alert.alert("Remove workout?", session.title, [
									{ text: "Keep", style: "cancel" },
									{
										text: "Remove",
										style: "destructive",
										onPress: () => removeSession(session.id),
									},
								]);
							}}
						>
							<Icon name="Line/Close" size={16} color={colors.textTertiary} />
						</Pressable>
					</View>
				))
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	day: { gap: 8 },
	dayHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingTop: 8,
		borderTopWidth: 1,
	},
	rowText: { flex: 1, gap: 2 },
});
