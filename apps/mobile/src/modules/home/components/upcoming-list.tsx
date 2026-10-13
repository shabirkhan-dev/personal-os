import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { rise, usePoTheme } from "@/theme";
import { tileToneFor, type Upcoming } from "../lib/today";

export type UpcomingListProps = {
	upcoming: Upcoming;
	/** "Now 16:20" */
	now: string;
};

/** Home "Upcoming": the next item as a large pill, then time · dot · title · value rows. */
export function UpcomingList({ upcoming, now }: UpcomingListProps) {
	const { colors } = usePoTheme();
	const card = { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault };
	const { next, later } = upcoming;

	return (
		<View style={styles.list}>
			<View style={styles.head}>
				<PoText variant="title18">Upcoming</PoText>
				<View style={[styles.now, { borderColor: colors.borderDefault }]}>
					<View style={[styles.nowDot, { backgroundColor: colors.statusSuccess }]} />
					<PoText variant="eyebrow11" tone="textSecondary">
						{now}
					</PoText>
				</View>
			</View>
			{next ? (
				<Animated.View entering={rise()} style={[styles.next, card]}>
					<View style={[styles.nextTile, { backgroundColor: colors[tileToneFor(next.tone)] }]}>
						<Icon name={next.icon} color={colors[next.tone]} />
					</View>
					<View style={styles.nextText}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{next.tomorrow ? `Tomorrow · in ${next.startsIn}` : `Next · in ${next.startsIn}`}
						</PoText>
						<PoText variant="title18" numberOfLines={1}>
							{next.title}
						</PoText>
					</View>
					<PoText variant="mono13" tone="textSecondary" style={styles.nextMeta}>
						{next.time}
					</PoText>
				</Animated.View>
			) : (
				<View style={[styles.row, card]}>
					<PoText variant="row15" tone="textSecondary">
						Nothing planned yet
					</PoText>
				</View>
			)}
			{later.map((item, index) => (
				<Animated.View key={item.id} entering={rise(80 * (index + 1))} style={[styles.row, card]}>
					<PoText variant="mono13" tone="textTertiary" style={styles.time}>
						{item.time}
					</PoText>
					<View style={[styles.dot, { backgroundColor: colors[item.tone] }]} />
					<PoText variant="row15" style={styles.title} numberOfLines={1}>
						{item.title}
					</PoText>
					<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
						{item.meta}
					</PoText>
				</Animated.View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: { gap: 10 },
	head: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: 4,
	},
	now: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 10,
		paddingRight: 12,
		paddingVertical: 6,
		borderRadius: 14,
		borderWidth: 1,
	},
	nowDot: { width: 6, height: 6, borderRadius: 3 },
	next: {
		height: 72,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 20,
		borderRadius: 36,
		borderWidth: 1,
	},
	nextTile: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	nextText: { flex: 1, gap: 3 },
	nextMeta: { flexShrink: 0 },
	row: {
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 20,
		borderRadius: 28,
		borderWidth: 1,
	},
	time: { width: 44 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	title: { flex: 1 },
});
