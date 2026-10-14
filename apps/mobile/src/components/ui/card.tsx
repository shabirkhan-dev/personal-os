import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { usePoTheme } from "@/theme";

/** Kit v2 widget card: bg/surface, border/default, radius 28, 20 padding. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				style,
			]}
		>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 16, padding: 20, borderRadius: 28, borderWidth: 1 },
});
