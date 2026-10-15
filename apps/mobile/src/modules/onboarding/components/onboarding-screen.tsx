import type { ColorTokens } from "@personal-os/tokens";
import { type ComponentRef, type ReactNode, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glow } from "@/components/ui/glow";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { useKeyboardOverlap } from "@/lib/use-keyboard";
import { usePoTheme } from "@/theme";

export type OnboardingScreenProps = {
	children: ReactNode;
	/** Token for the top glow; omitted on the plain setup steps. */
	glow?: keyof ColorTokens;
	/** Pinned footer (pill buttons). */
	footer?: ReactNode;
	/** Scroll the body when it can outgrow small screens. */
	scroll?: boolean;
};

/**
 * Onboarding frame shell: bg/app, 16px gutters, 60px top and 34px bottom insets on a
 * 390×844 frame, adapted to the device safe area.
 */
export function OnboardingScreen({
	children,
	glow,
	footer,
	scroll = false,
}: OnboardingScreenProps) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const paddingTop = Math.max(60, insets.top + 12);
	const root = useRef<ComponentRef<typeof View>>(null);
	// The footer and fields move up above the keyboard instead of hiding under it.
	const keyboard = useKeyboardOverlap(root);
	const paddingBottom = keyboard > 0 ? keyboard + 12 : Math.max(34, insets.bottom);

	const body = scroll ? (
		<KeyboardAwareScrollView
			addRoom={false}
			style={styles.fill}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			{children}
		</KeyboardAwareScrollView>
	) : (
		<View style={styles.fill}>{children}</View>
	);

	return (
		<View
			ref={root}
			collapsable={false}
			style={[styles.root, { backgroundColor: colors.bgApp, paddingTop, paddingBottom }]}
		>
			{glow ? <Glow tone={glow} /> : null}
			{body}
			{footer ? <View style={styles.footer}>{footer}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, paddingHorizontal: 16, overflow: "hidden" },
	fill: { flex: 1 },
	scrollContent: { flexGrow: 1 },
	footer: { gap: 10, paddingTop: 16 },
});
