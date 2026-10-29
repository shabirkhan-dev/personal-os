import { elevation } from "@personal-os/tokens";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { toShadowStyle, usePoTheme } from "@/theme";
import { type AssistantPlace, prepareFor } from "../hooks/use-assistant";
import { AssistantSheet } from "./assistant-sheet";

/**
 * The "Ask" button that floats above the tab bar on a screen, opening the assistant about what
 * is on that screen.
 */
export function AskAssistant({ place }: { place: AssistantPlace }) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const [open, setOpen] = useState(false);
	return (
		<>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Ask the assistant about this screen"
				onPress={() => {
					haptics.tap();
					prepareFor(place);
					setOpen(true);
				}}
				style={({ pressed }) => [
					styles.button,
					{
						bottom: insets.bottom + 92,
						backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
						borderColor: colors.accentSubtleBorder,
					},
					toShadowStyle(elevation.floating),
				]}
			>
				<Icon name="Filled/Sparkle" size={16} color={colors.accentDefault} />
				<PoText variant="text14Medium">Ask</PoText>
			</Pressable>
			<AssistantSheet visible={open} onClose={() => setOpen(false)} />
		</>
	);
}

const styles = StyleSheet.create({
	button: {
		position: "absolute",
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 14,
		height: 40,
		borderRadius: 999,
		borderWidth: 1,
	},
});
