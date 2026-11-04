import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { usePoTheme } from "@/theme";

/** Height the bar's row takes; screens leave this much room at the top of their scroll. */
export const STICKY_ROW = 40;

/**
 * The header row pinned over a screen while its content scrolls. Clear at the top so the glow
 * shows through; once content slides under it (`solid`), it takes the app background.
 */
export function StickyBar({
	topInset,
	solid,
	children,
}: {
	topInset: number;
	solid: boolean;
	children: ReactNode;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			pointerEvents="box-none"
			style={[
				styles.bar,
				{ paddingTop: topInset + 6, backgroundColor: solid ? colors.bgApp : "transparent" },
			]}
		>
			{children}
		</View>
	);
}

/** Whether a scroll has moved far enough that content sits under the bar. */
export const scrolledPast = (y: number) => y > 8;

const styles = StyleSheet.create({
	bar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		alignItems: "center",
		paddingBottom: 8,
		zIndex: 10,
	},
});
