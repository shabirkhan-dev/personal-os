import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { PoThemeProvider, usePoTheme } from "@/theme";

/**
 * Expo Router error screen: a render error shows what failed and a retry instead of a blank
 * screen or a crash. The technical message shows in development builds only; release builds log it.
 */
export function RouteError({ error, retry }: ErrorBoundaryProps) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		console.error("[route] render failed", error);
	}, [error]);

	return (
		<View
			style={[
				styles.root,
				{
					backgroundColor: colors.bgApp,
					paddingTop: insets.top + 24,
					paddingBottom: insets.bottom + 24,
				},
			]}
		>
			<View style={styles.text}>
				<PoText variant="title30">Something went wrong</PoText>
				<PoText variant="body15" tone="textSecondary">
					This screen hit an error. Your plan is still saved on this phone.
				</PoText>
				{__DEV__ ? (
					<PoText variant="mono13" tone="textTertiary" selectable>
						{error.message}
					</PoText>
				) : null}
			</View>
			<PillButton
				label="Try again"
				onPress={() => {
					retry().catch((caught: unknown) => console.error("[route] retry failed", caught));
				}}
			/>
		</View>
	);
}

/**
 * The root layout's boundary. It renders in place of the root layout, outside its theme
 * provider, so it brings its own; a crash in the providers then shows this, not a closed app.
 */
export function RootError(props: ErrorBoundaryProps) {
	return (
		<PoThemeProvider>
			<RouteError {...props} />
		</PoThemeProvider>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
	text: { gap: 12 },
});
