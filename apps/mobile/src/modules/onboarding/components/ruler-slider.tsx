import { textStyles } from "@personal-os/tokens";
import { memo, useCallback, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { toTextStyle, usePoTheme } from "@/theme";

/** Tick pitch measured from the Figma ruler (40 units across 326px). */
export const TICK_SPACING = 8.2;

export type RulerSliderProps = {
	min: number;
	max: number;
	value: number;
	onChange: (value: number) => void;
	accessibilityLabel: string;
	/** Formats the major (every 10) labels. */
	formatLabel?: (value: number) => string;
};

const monoStyle = toTextStyle(textStyles.mono13);

/**
 * Horizontal ruler: 2px ticks (10px minor, 16px every 5, 24px + label every 10) under a
 * fixed 3×30 accent indicator. Scrolling snaps one unit per tick.
 */
export function RulerSlider({
	min,
	max,
	value,
	onChange,
	accessibilityLabel,
	formatLabel = String,
}: RulerSliderProps) {
	const { colors } = usePoTheme();
	const [width, setWidth] = useState(0);
	const lastValue = useSharedValue(value);
	const [initialOffset] = useState(() => ({ x: (value - min) * TICK_SPACING, y: 0 }));

	const emit = useCallback((next: number) => onChange(next), [onChange]);

	const onScroll = useAnimatedScrollHandler((event) => {
		const next = Math.min(
			max,
			Math.max(min, Math.round(event.contentOffset.x / TICK_SPACING) + min),
		);
		if (next !== lastValue.value) {
			lastValue.value = next;
			scheduleOnRN(emit, next);
		}
	});

	const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
	const sidePadding = width / 2;

	return (
		<View
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ min, max, now: value }}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={(event) => {
				const step = event.nativeEvent.actionName === "increment" ? 1 : -1;
				onChange(Math.min(max, Math.max(min, value + step)));
			}}
			onLayout={onLayout}
			style={styles.ruler}
		>
			{width > 0 ? (
				<Animated.ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={TICK_SPACING}
					decelerationRate="fast"
					scrollEventThrottle={16}
					onScroll={onScroll}
					contentOffset={initialOffset}
					contentContainerStyle={{ paddingHorizontal: sidePadding - 1 }}
				>
					<Ticks
						min={min}
						max={max}
						major={colors.textSecondary}
						minor={colors.textTertiary}
						formatLabel={formatLabel}
					/>
				</Animated.ScrollView>
			) : null}
			<View
				pointerEvents="none"
				style={[styles.indicator, { backgroundColor: colors.accentDefault }]}
			/>
		</View>
	);
}

type TicksProps = {
	min: number;
	max: number;
	major: string;
	minor: string;
	formatLabel: (value: number) => string;
};

const Ticks = memo(function Ticks({ min, max, major, minor, formatLabel }: TicksProps) {
	const ticks = [];
	for (let unit = min; unit <= max; unit += 1) {
		const isMajor = unit % 10 === 0;
		const isMid = unit % 5 === 0;
		ticks.push(
			<View key={unit} style={styles.tickSlot}>
				<View
					style={[
						styles.tick,
						{
							height: isMajor ? 24 : isMid ? 16 : 10,
							backgroundColor: isMajor ? major : minor,
						},
					]}
				/>
				{isMajor ? (
					<Animated.Text
						allowFontScaling={false}
						numberOfLines={1}
						style={[monoStyle, styles.label, { color: minor }]}
					>
						{formatLabel(unit)}
					</Animated.Text>
				) : null}
			</View>,
		);
	}
	return <View style={styles.ticks}>{ticks}</View>;
});

const styles = StyleSheet.create({
	ruler: { height: 56, overflow: "hidden" },
	ticks: { flexDirection: "row", height: 56 },
	tickSlot: { width: TICK_SPACING, alignItems: "flex-start" },
	tick: { width: 2, borderRadius: 1 },
	label: {
		position: "absolute",
		top: 32,
		width: 40,
		left: -19,
		textAlign: "center",
	},
	indicator: {
		position: "absolute",
		top: 0,
		left: "50%",
		marginLeft: -1.5,
		width: 3,
		height: 30,
		borderRadius: 1.5,
	},
});
