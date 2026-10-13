import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { rise, usePoTheme } from "@/theme";

type Item = {
	time: string;
	dot: keyof ColorTokens;
	title: string;
	value?: string;
	action?: string;
};

const items: readonly Item[] = [
	{ time: "21:00", dot: "statusSuccess", title: "Evening check-in", value: "2 min" },
	{ time: "Wed", dot: "statusViolet", title: "Skincare restock", value: "Rs 2,400" },
	{ time: "Sat", dot: "statusCaution", title: "Electricity bill", action: "Pay Rs 6,200" },
];

/** Frame 03 preview: the Home "Upcoming" section. */
export function UpcomingPreview() {
	const { colors } = usePoTheme();
	const card = { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault };

	return (
		<View style={styles.list}>
			<View style={styles.head}>
				<PoText variant="title18">Upcoming</PoText>
				<View style={[styles.now, { borderColor: colors.borderDefault }]}>
					<View style={[styles.nowDot, { backgroundColor: colors.statusSuccess }]} />
					<PoText variant="eyebrow11" tone="textSecondary">
						Now 16:20
					</PoText>
				</View>
			</View>
			<Animated.View entering={rise()} style={[styles.next, card]}>
				<View style={[styles.nextTile, { backgroundColor: colors.statusSuccessSubtle }]}>
					<Icon name="Dumbbell" color={colors.statusSuccess} />
				</View>
				<View style={styles.nextText}>
					<PoText variant="eyebrow11" tone="textTertiary">
						Next · in 2h 10m
					</PoText>
					<PoText variant="title18">Gym · Push day</PoText>
				</View>
				<View style={[styles.play, { backgroundColor: colors.bgInverse }]}>
					<Icon name="Filled/Play" color={colors.textInverse} />
				</View>
			</Animated.View>
			{items.map((item, index) => (
				<Animated.View
					key={item.title}
					entering={rise(80 * (index + 1))}
					style={[styles.row, card, item.action ? styles.rowAction : null]}
				>
					<PoText variant="mono13" tone="textTertiary" style={styles.time}>
						{item.time}
					</PoText>
					<View style={[styles.dot, { backgroundColor: colors[item.dot] }]} />
					<PoText variant="row15" style={styles.title} numberOfLines={1}>
						{item.title}
					</PoText>
					{item.action ? (
						<View style={[styles.pay, { backgroundColor: colors.bgInverse }]}>
							<PoText variant="meta13" tone="textInverse">
								{item.action}
							</PoText>
						</View>
					) : (
						<PoText variant="meta13" tone="textSecondary">
							{item.value}
						</PoText>
					)}
				</Animated.View>
			))}
			<Animated.View
				entering={rise(320)}
				style={[styles.add, { borderColor: colors.borderDefault }]}
			>
				<PoText variant="row15" tone="textSecondary">
					Add to plan
				</PoText>
				<View style={[styles.plus, { backgroundColor: colors.bgInverse }]}>
					<Icon name="Filled/Plus" size={14} color={colors.textInverse} />
				</View>
			</Animated.View>
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
		paddingHorizontal: 8,
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
	play: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
	row: {
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 20,
		borderRadius: 28,
		borderWidth: 1,
	},
	rowAction: { paddingRight: 8 },
	time: { width: 44 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	title: { flex: 1 },
	pay: { height: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: "center" },
	add: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderRadius: 26,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	plus: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});
