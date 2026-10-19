import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { AppProviders } from "@/components/providers";
import { RootError } from "@/components/route-error";
import { PoThemeProvider, poFontAssets, usePoTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch((error: unknown) =>
	console.warn("[splash] could not keep the splash screen up", error),
);

/** Catches render errors in the providers and in screens without their own boundary. */
export const ErrorBoundary = RootError;

export default function RootLayout() {
	return (
		<AppProviders>
			<PoThemeProvider>
				<RootNavigator />
			</PoThemeProvider>
		</AppProviders>
	);
}

function RootNavigator() {
	const { mode, colors } = usePoTheme();
	const [fontsLoaded, fontError] = useFonts(poFontAssets);
	const ready = fontsLoaded || fontError !== null;

	useEffect(() => {
		if (fontError) console.warn("[fonts] a bundled font failed to load", fontError);
		if (ready)
			SplashScreen.hideAsync().catch((error: unknown) =>
				console.warn("[splash] could not hide the splash screen", error),
			);
	}, [ready, fontError]);

	const navigationTheme = useMemo(() => {
		const base = mode === "dark" ? DarkTheme : DefaultTheme;
		return {
			...base,
			colors: {
				...base.colors,
				background: colors.bgApp,
				card: colors.bgSurface,
				text: colors.textPrimary,
				border: colors.borderDefault,
				primary: colors.accentDefault,
			},
		};
	}, [mode, colors]);

	if (!ready) return null;

	return (
		<ThemeProvider value={navigationTheme}>
			<StatusBar style={mode === "dark" ? "light" : "dark"} />
			<Stack
				screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgApp } }}
			>
				<Stack.Screen name="(home)" />
				<Stack.Screen name="(onboarding)" />
			</Stack>
		</ThemeProvider>
	);
}
