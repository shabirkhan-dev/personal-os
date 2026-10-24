import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { Activity } from "../lib/activities";
import { SPORT_TONES } from "./home-cards";

/**
 * The activities someone does besides programmed training (football, swimming, a class): tap one
 * to log it, hold to edit it, or add another.
 */
export function ActivitiesCard({
	activities,
	onLog,
	onEdit,
	onAdd,
}: {
	activities: readonly Activity[];
	onLog: (activity: Activity) => void;
	onEdit: (activity: Activity) => void;
	onAdd: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.head}>
				<PoText variant="title18" style={styles.flex}>
					Your activities
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{activities.length > 0 ? "Tap to log · hold to edit" : ""}
				</PoText>
			</View>
			{activities.length === 0 ? (
				<PoText variant="meta13" tone="textSecondary">
					Add what you do besides workouts, like football, swimming or a class, with the numbers you
					want to track. Pin them to fixed days when you start a program.
				</PoText>
			) : null}
			<View style={styles.wrap}>
				{activities.map((activity) => (
					<Pressable
						key={activity.id}
						accessibilityRole="button"
						accessibilityLabel={`Log ${activity.name}`}
						accessibilityHint="Hold to edit"
						onPress={() => {
							haptics.tap();
							onLog(activity);
						}}
						onLongPress={() => onEdit(activity)}
						style={[styles.chip, { backgroundColor: colors.bgSubtle }]}
					>
						<View style={[styles.dot, { backgroundColor: colors[SPORT_TONES[activity.kind]] }]} />
						<PoText variant="row15">{activity.name}</PoText>
					</Pressable>
				))}
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Add an activity"
					onPress={onAdd}
					style={[styles.chip, { borderColor: colors.borderDefault, borderWidth: 1 }]}
				>
					<Icon name="Line/Plus" size={14} color={colors.textPrimary} />
					<PoText variant="row15">Add</PoText>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	flex: { flex: 1 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 14,
		height: 40,
		borderRadius: 20,
	},
	dot: { width: 8, height: 8, borderRadius: 4 },
});
