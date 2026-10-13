import { type ColorTokens, type TextStyleName, textStyles } from "@personal-os/tokens";
import { useMemo } from "react";
import { Text, type TextProps } from "react-native";
import { toTextStyle, usePoTheme } from "@/theme";

export type PoTextProps = TextProps & {
	/** PO text style from Kit v2. */
	variant?: TextStyleName;
	/** Colour token name. */
	tone?: keyof ColorTokens;
};

/** Text rendered with a PO text style and a colour token; never a raw colour. */
export function PoText({ variant = "body15", tone = "textPrimary", style, ...rest }: PoTextProps) {
	const { colors } = usePoTheme();
	const base = useMemo(() => toTextStyle(textStyles[variant]), [variant]);

	return <Text allowFontScaling={false} style={[base, { color: colors[tone] }, style]} {...rest} />;
}
