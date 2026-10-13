import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { usePoTheme } from "@/theme";

const spring = { damping: 20, stiffness: 220 };

/** Welcome pager dots: the current step stretches to 22px in text/primary. */
export function StepDots({ count, active }: { count: number; active: number }) {
	return (
		<View style={styles.row} accessibilityLabel={`Step ${active + 1} of ${count}`}>
			{Array.from({ length: count }, (_, index) => (
				<Dot
					key={`dot-${index}`}
					state={index === active ? "active" : index < active ? "done" : "todo"}
				/>
			))}
		</View>
	);
}

function Dot({ state }: { state: "active" | "done" | "todo" }) {
	const { colors } = usePoTheme();
	const width = useSharedValue(8);
	const lit = useSharedValue(state === "todo" ? 0 : 1);

	useEffect(() => {
		width.value = withSpring(state === "active" ? 22 : 8, spring);
		lit.value = withSpring(state === "todo" ? 0 : 1, spring);
	}, [state, width, lit]);

	const style = useAnimatedStyle(() => ({
		width: width.value,
		backgroundColor: interpolateColor(
			lit.value,
			[0, 1],
			[colors.borderDefault, colors.textPrimary],
		),
	}));

	return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: 6, alignItems: "center" },
	dot: { height: 4, borderRadius: 2 },
});
