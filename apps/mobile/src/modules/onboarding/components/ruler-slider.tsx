import { textStyles } from "@personal-os/tokens";
import { memo, useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
	scrollTo,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { toTextStyle, usePoTheme } from "@/theme";

/** Tick pitch measured from the Figma ruler (40 units across 326px). */
export const TICK_SPACING = 8.2;

export type RulerSliderProps = {
	min: number;
	max: number;
	value: number;
	onChange: (value: number) => void;
	accessibilityLabel: string;
	/** Formats the major labels (every 10 units from the starting value). */
	formatLabel?: (value: number) => string;
};

const monoStyle = toTextStyle(textStyles.mono13);
const LABEL_WIDTH = 48;

/**
 * Horizontal ruler: 2px ticks (10px minor, 16px at the half, 24px + label every 10) under a
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
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	// Labels sit every 10 units counted from the starting value, as in the Figma ruler.
	const [initialValue] = useState(value);
	const initialX = (initialValue - min) * TICK_SPACING;

	// Position the ruler on the current value once it has a width (contentOffset is
	// ignored on some platforms).
	useEffect(() => {
		if (width <= 0) return;
		scheduleOnUI(() => {
			"worklet";
			scrollTo(scrollRef, initialX, 0, false);
		});
	}, [width, initialX, scrollRef]);

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
					ref={scrollRef}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={TICK_SPACING}
					decelerationRate="fast"
					scrollEventThrottle={16}
					onScroll={onScroll}
					contentOffset={{ x: initialX, y: 0 }}
					contentContainerStyle={{ paddingHorizontal: sidePadding - 1 }}
				>
					<Ticks
						min={min}
						max={max}
						major={colors.textSecondary}
						minor={colors.textTertiary}
						anchor={initialValue}
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
	anchor: number;
	formatLabel: (value: number) => string;
};

const Ticks = memo(function Ticks({ min, max, major, minor, anchor, formatLabel }: TicksProps) {
	const ticks = [];
	const labels = [];
	for (let unit = min; unit <= max; unit += 1) {
		const offset = (((unit - anchor) % 10) + 10) % 10;
		const isMajor = offset === 0;
		const isMid = offset === 5;
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
			</View>,
		);
		if (isMajor) {
			labels.push(
				<Animated.Text
					key={unit}
					allowFontScaling={false}
					numberOfLines={1}
					style={[
						monoStyle,
						styles.label,
						{ color: minor, left: (unit - min) * TICK_SPACING + 1 - LABEL_WIDTH / 2 },
					]}
				>
					{formatLabel(unit)}
				</Animated.Text>,
			);
		}
	}
	return (
		<View style={[styles.ticks, { width: (max - min + 1) * TICK_SPACING }]}>
			{ticks}
			{labels}
		</View>
	);
});

const styles = StyleSheet.create({
	ruler: { height: 56, overflow: "hidden" },
	ticks: { flexDirection: "row", height: 56 },
	tickSlot: { width: TICK_SPACING, alignItems: "flex-start" },
	tick: { width: 2, borderRadius: 1 },
	label: { position: "absolute", top: 32, width: LABEL_WIDTH, textAlign: "center" },
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
