import { elevation } from "@personal-os/tokens";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { rise, toShadowStyle, usePoTheme } from "@/theme";
import type { Section } from "../lib/module-sections";

export type SectionsMenuProps = {
	top: number;
	title: string;
	sections: readonly Section[];
	onClose: () => void;
};

/** The module pill's menu: the screens inside the module you're in, one tap away. */
export function SectionsMenu({ top, title, sections, onClose }: SectionsMenuProps) {
	const { colors } = usePoTheme();
	return (
		<View style={StyleSheet.absoluteFill}>
			<Animated.View
				entering={FadeIn.duration(160)}
				exiting={FadeOut.duration(120)}
				style={StyleSheet.absoluteFill}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close"
					onPress={onClose}
					style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
				/>
			</Animated.View>
			<Animated.View
				entering={rise()}
				exiting={FadeOut.duration(120)}
				style={[
					styles.card,
					{ top, backgroundColor: colors.bgSurface },
					toShadowStyle(elevation.floating),
				]}
			>
				<PoText variant="meta13" tone="textTertiary" style={styles.title}>
					{title}
				</PoText>
				{sections.map((section) => (
					<Pressable
						key={section.href}
						accessibilityRole="button"
						onPress={() => {
							haptics.select();
							onClose();
							router.push(section.href);
						}}
						style={({ pressed }) => [
							styles.row,
							pressed ? { backgroundColor: colors.bgHover } : null,
						]}
					>
						<PoText variant="row15" style={styles.flex}>
							{section.label}
						</PoText>
						<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
					</Pressable>
				))}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: {
		position: "absolute",
		left: 56,
		right: 56,
		padding: 8,
		borderRadius: 20,
	},
	title: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
	row: {
		height: 44,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		borderRadius: 12,
	},
});
