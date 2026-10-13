import { textStyles } from "@personal-os/tokens";
import { useEffect, useRef, useState } from "react";
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { type PoTextStyle, toTextStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
	options: readonly SegmentedOption<T>[];
	/** `null` shows no selection yet. */
	value: T | null;
	onChange: (value: T) => void;
	/** "lg" = full-width 48px segments (Gender); "sm" = 52×28 unit switch (cm / ft). */
	size?: "lg" | "sm";
	accessibilityLabel?: string;
};

const spring = { damping: 22, stiffness: 260, mass: 0.8 };

/** Segmented control: bg/surface track, accent thumb that slides between options. */
export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	size = "lg",
	accessibilityLabel,
}: SegmentedControlProps<T>) {
	const { colors } = usePoTheme();
	const [trackWidth, setTrackWidth] = useState(0);
	const isLarge = size === "lg";
	const gap = 4;
	const padding = 4;
	const segmentWidth = isLarge
		? trackWidth > 0
			? (trackWidth - 2 - padding * 2 - gap * (options.length - 1)) / options.length
			: 0
		: 52;
	const index = options.findIndex((option) => option.value === value);

	const offset = useSharedValue(0);
	const placed = useRef(false);
	useEffect(() => {
		if (segmentWidth <= 0 || index < 0) return;
		const target = index * (segmentWidth + gap);
		// Snap into place on first layout, spring on later changes.
		offset.value = placed.current ? withSpring(target, spring) : target;
		placed.current = true;
	}, [index, segmentWidth, offset]);
	const thumbStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.value }],
	}));

	const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);
	const labelStyle = toTextStyle(isLarge ? textStyles.row15 : textStyles.meta13);

	return (
		<View
			accessibilityRole="radiogroup"
			accessibilityLabel={accessibilityLabel}
			onLayout={onLayout}
			style={[
				styles.track,
				isLarge ? styles.trackLarge : styles.trackSmall,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			{segmentWidth > 0 && index >= 0 ? (
				<Animated.View
					style={[
						styles.thumb,
						isLarge ? styles.segmentLarge : styles.segmentSmall,
						{ width: segmentWidth, backgroundColor: colors.accentDefault },
						thumbStyle,
					]}
				/>
			) : null}
			{options.map((option, optionIndex) => (
				<Segment
					key={option.value}
					label={option.label}
					active={optionIndex === index}
					onPress={() => {
						if (option.value !== value) haptics.select();
						onChange(option.value);
					}}
					large={isLarge}
					width={isLarge ? undefined : segmentWidth}
					labelStyle={labelStyle}
					activeColor={colors.textOnAccent}
					idleColor={colors.textSecondary}
				/>
			))}
		</View>
	);
}

type SegmentProps = {
	label: string;
	active: boolean;
	onPress: () => void;
	large: boolean;
	width?: number;
	labelStyle: PoTextStyle;
	activeColor: string;
	idleColor: string;
};

function Segment({
	label,
	active,
	onPress,
	large,
	width,
	labelStyle,
	activeColor,
	idleColor,
}: SegmentProps) {
	const progress = useSharedValue(active ? 1 : 0);
	useEffect(() => {
		progress.value = withSpring(active ? 1 : 0, spring);
	}, [active, progress]);
	const textStyle = useAnimatedStyle(() => ({
		color: interpolateColor(progress.value, [0, 1], [idleColor, activeColor]),
	}));

	return (
		<Pressable
			accessibilityRole="radio"
			accessibilityState={{ selected: active }}
			onPress={onPress}
			style={[large ? styles.segmentLarge : styles.segmentSmall, large ? styles.fill : { width }]}
		>
			<Animated.Text allowFontScaling={false} style={[labelStyle, textStyle]}>
				{label}
			</Animated.Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	track: {
		flexDirection: "row",
		gap: 4,
		padding: 4,
		borderWidth: 1,
		overflow: "hidden",
	},
	trackLarge: { borderRadius: 28, alignSelf: "stretch" },
	trackSmall: { borderRadius: 18, alignSelf: "flex-start" },
	thumb: { position: "absolute", left: 4, top: 4 },
	segmentLarge: {
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	segmentSmall: {
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	fill: { flex: 1 },
});
