import { LinearGradient } from "expo-linear-gradient";
import type * as React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/providers/theme-provider";

interface NeonCardProps {
	children: React.ReactNode;
	style?: ViewStyle;
	glowPosition?: "top-right" | "bottom-left" | "both-diagonal" | "none";
}

export function NeonCard({ children, style }: NeonCardProps) {
	const { colors } = useTheme();

	return (
		<View style={[styles.outerContainer, style]}>
			<LinearGradient
				colors={colors.card.gradient}
				style={[
					styles.card,
					{
						borderColor: colors.card.border,
					},
				]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
			>
				<View style={styles.content}>{children}</View>
			</LinearGradient>
		</View>
	);
}

const styles = StyleSheet.create({
	outerContainer: {
		position: "relative",
		padding: 0,
	},
	card: {
		borderRadius: 32,
		borderWidth: 1,
		overflow: "hidden",
	},
	content: {
		padding: 24,
	},
});
