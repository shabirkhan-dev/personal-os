import type { ColorTokens } from "@personal-os/tokens";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { type RichPart, RichText } from "./rich-text";

export type TextBlockProps = {
	eyebrow: string;
	title: string;
	body: readonly RichPart[];
	/** Welcome screens show a coloured dot before a text/secondary eyebrow. */
	dot?: keyof ColorTokens;
	/** Keeps the 8px rhythm even with a dot (plan reveal). */
	compact?: boolean;
};

/** Eyebrow (JetBrains Mono), PO/Title 30 heading and PO/Body 15 copy. */
export function TextBlock({ eyebrow, title, body, dot, compact = false }: TextBlockProps) {
	const { colors } = usePoTheme();

	return (
		<Animated.View
			entering={FadeInDown.duration(380).delay(60)}
			style={[styles.block, dot && !compact ? styles.welcome : null]}
		>
			<View style={styles.eyebrow}>
				{dot ? <View style={[styles.dot, { backgroundColor: colors[dot] }]} /> : null}
				<PoText variant="eyebrow11" tone={dot ? "textSecondary" : "textTertiary"}>
					{eyebrow}
				</PoText>
			</View>
			<PoText variant="title30">{title}</PoText>
			<RichText parts={body} />
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	block: { gap: 8, paddingHorizontal: 4 },
	welcome: { gap: 10 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
});
