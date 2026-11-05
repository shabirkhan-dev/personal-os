import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { WaterPace } from "../lib/food-math";

const GLASS_H = 104;
const litres = (ml: number) => (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1);

const PACE: Record<
	WaterPace["state"],
	{ text: (left: number) => string; tone: "textSuccess" | "textSecondary" | "textWarning" }
> = {
	done: { text: () => "Goal reached. Nicely done.", tone: "textSuccess" },
	ahead: {
		text: (left) => `Ahead of pace · ${left} ${left === 1 ? "glass" : "glasses"} to go`,
		tone: "textSuccess",
	},
	"on-pace": {
		text: (left) => `On pace · ${left} ${left === 1 ? "glass" : "glasses"} to go`,
		tone: "textSecondary",
	},
	behind: {
		text: (left) => `A little behind · ${left} ${left === 1 ? "glass" : "glasses"} to go`,
		tone: "textWarning",
	},
};

/**
 * Today's water as a glass that fills up, how it's going against an even pace, one-tap glass and
 * bottle buttons, and the last seven days with the streak.
 */
export function WaterCard({
	ml,
	targetMl,
	pace,
	week,
	streak,
	onAdd,
	onMore,
}: {
	ml: number;
	targetMl: number;
	pace: WaterPace;
	/** The last seven days, oldest first: whether each reached the target. */
	week: readonly { label: string; met: boolean; today: boolean }[];
	streak: number;
	onAdd: (ml: number) => void;
	onMore: () => void;
}) {
	const { colors } = usePoTheme();
	const share = Math.min(1, targetMl > 0 ? ml / targetMl : 0);
	const level = useSharedValue(share);

	useEffect(() => {
		level.value = withTiming(share, { duration: 500 });
	}, [share, level]);

	const fill = useAnimatedStyle(() => ({ height: Math.max(6, level.value * (GLASS_H - 8)) }));
	const status = PACE[pace.state];

	return (
		<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
			<View style={styles.top}>
				<View
					accessibilityRole="progressbar"
					accessibilityLabel={`Water, ${Math.round(share * 100)} percent of today's goal`}
					style={[
						styles.glass,
						{ borderColor: colors.borderStrong, backgroundColor: colors.bgSubtle },
					]}
				>
					<Animated.View style={[styles.fill, { backgroundColor: colors.accentDefault }, fill]}>
						<View style={[styles.shine, { backgroundColor: colors.accentSubtleBorder }]} />
					</Animated.View>
					<View style={styles.percent}>
						<PoText variant="meta13" tone={share > 0.45 ? "textOnAccent" : "textSecondary"}>
							{`${Math.round(share * 100)}%`}
						</PoText>
					</View>
				</View>
				<View style={styles.flex}>
					<PoText variant="eyebrow11" tone="textTertiary">
						Water today
					</PoText>
					<PoText variant="title30">
						{litres(ml)}
						<PoText variant="row15" tone="textSecondary">{` of ${litres(targetMl)} L`}</PoText>
					</PoText>
					<PoText variant="meta13" tone={status.tone}>
						{status.text(pace.glassesLeft)}
					</PoText>
				</View>
			</View>
			<View style={styles.buttons}>
				<DrinkButton icon="Drop" label="Glass" amount="250 ml" onPress={() => onAdd(250)} />
				<DrinkButton icon="Drop" label="Bottle" amount="500 ml" onPress={() => onAdd(500)} />
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Other amounts or undo"
					onPress={() => {
						haptics.tap();
						onMore();
					}}
					style={({ pressed }) => [
						styles.more,
						{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
					]}
				>
					<PoText variant="text14Medium">More</PoText>
				</Pressable>
			</View>
			<View style={styles.week}>
				{week.map((day, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- a fixed run of days
					<View key={index} style={styles.dayCol}>
						<View
							style={[
								styles.dot,
								{
									backgroundColor: day.met ? colors.accentDefault : colors.bgSubtle,
									borderColor: day.today ? colors.accentDefault : "transparent",
								},
							]}
						>
							{day.met ? <Icon name="Check bold" size={10} color={colors.textOnAccent} /> : null}
						</View>
						<PoText variant="meta13" tone={day.today ? "textPrimary" : "textTertiary"}>
							{day.label}
						</PoText>
					</View>
				))}
				<View style={styles.streak}>
					<PoText variant="row15">{String(streak)}</PoText>
					<PoText variant="meta13" tone="textTertiary">
						day streak
					</PoText>
				</View>
			</View>
		</View>
	);
}

function DrinkButton({
	icon,
	label,
	amount,
	onPress,
}: {
	icon: "Drop";
	label: string;
	amount: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Add a ${label.toLowerCase()} of water, ${amount}`}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [
				styles.drink,
				{ backgroundColor: pressed ? colors.accentSubtleBorder : colors.accentSubtle },
			]}
		>
			<Icon name={icon} size={16} color={colors.accentDefault} />
			<View>
				<PoText variant="text14Medium">{`+ ${label}`}</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{amount}
				</PoText>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 2 },
	card: { gap: 16, padding: 16, borderRadius: 20 },
	top: { flexDirection: "row", alignItems: "center", gap: 16 },
	glass: {
		width: 60,
		height: GLASS_H,
		borderWidth: 2,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		borderBottomLeftRadius: 18,
		borderBottomRightRadius: 18,
		padding: 2,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	fill: {
		width: "100%",
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
	},
	shine: {
		position: "absolute",
		left: 6,
		top: 6,
		width: 6,
		bottom: 6,
		borderRadius: 3,
		opacity: 0.5,
	},
	percent: { position: "absolute", left: 0, right: 0, bottom: 8, alignItems: "center" },
	buttons: { flexDirection: "row", gap: 8 },
	drink: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 16,
	},
	more: { paddingHorizontal: 16, borderRadius: 16, justifyContent: "center" },
	week: { flexDirection: "row", alignItems: "center", gap: 6 },
	dayCol: { alignItems: "center", gap: 4, flex: 1 },
	dot: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	streak: { alignItems: "center", paddingLeft: 8, minWidth: 64 },
});
