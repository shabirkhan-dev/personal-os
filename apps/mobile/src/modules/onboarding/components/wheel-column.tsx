import { textStyles } from "@personal-os/tokens";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	scrollTo,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { toTextStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export const WHEEL_ROW = 30;
export const WHEEL_HEIGHT = 176;
const PAD = WHEEL_HEIGHT / 2 - WHEEL_ROW / 2;

const selectedStyle = toTextStyle(textStyles.title18);
const rowStyle = toTextStyle(textStyles.body15);

export type WheelColumnProps = {
	items: readonly string[];
	index: number;
	onChange: (index: number) => void;
	accessibilityLabel: string;
};

/** One column of the date wheel. The centred row is PO 18 Medium in text/primary. */
export function WheelColumn({ items, index, onChange, accessibilityLabel }: WheelColumnProps) {
	const { colors } = usePoTheme();
	const last = useSharedValue(index);
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const [initialY] = useState(() => index * WHEEL_ROW);

	useEffect(() => {
		scheduleOnUI(() => {
			"worklet";
			scrollTo(scrollRef, 0, initialY, false);
		});
	}, [initialY, scrollRef]);
	const emit = useCallback(
		(next: number) => {
			haptics.select();
			onChange(next);
		},
		[onChange],
	);

	const onScroll = useAnimatedScrollHandler((event) => {
		const next = Math.min(
			items.length - 1,
			Math.max(0, Math.round(event.contentOffset.y / WHEEL_ROW)),
		);
		if (next !== last.value) {
			last.value = next;
			scheduleOnRN(emit, next);
		}
	});

	return (
		<View
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ text: items[index] }}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={(event) => {
				const step = event.nativeEvent.actionName === "increment" ? 1 : -1;
				onChange(Math.min(items.length - 1, Math.max(0, index + step)));
			}}
			style={styles.column}
		>
			<Animated.ScrollView
				ref={scrollRef}
				showsVerticalScrollIndicator={false}
				snapToInterval={WHEEL_ROW}
				decelerationRate="fast"
				scrollEventThrottle={16}
				onScroll={onScroll}
				contentOffset={{ x: 0, y: initialY }}
				contentContainerStyle={styles.content}
				nestedScrollEnabled
			>
				{items.map((item, itemIndex) => {
					const distance = Math.abs(itemIndex - index);
					const selected = distance === 0;
					return (
						<View key={item} style={styles.row}>
							<Animated.Text
								allowFontScaling={false}
								style={[
									selected ? selectedStyle : rowStyle,
									{
										color: selected
											? colors.textPrimary
											: distance === 1
												? colors.textSecondary
												: colors.textTertiary,
										opacity: distance >= 3 ? 0 : distance === 2 ? 0.5 : 1,
									},
									styles.text,
								]}
							>
								{item}
							</Animated.Text>
						</View>
					);
				})}
			</Animated.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	column: { flex: 1, height: WHEEL_HEIGHT },
	content: { paddingVertical: PAD },
	row: { height: WHEEL_ROW, alignItems: "center", justifyContent: "center" },
	text: { textAlign: "center" },
});
