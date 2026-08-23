import "../global.css";
import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { AppProviders } from "@/components/providers";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
	initialRouteName: "(modules)",
};

export default function RootLayout() {
	const colorScheme = useColorScheme();

	useEffect(() => {
		SplashScreen.hideAsync().catch(() => undefined);
	}, []);

	return (
		<AppProviders>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="(modules)" />
					<Stack.Screen name="(auth)" />
				</Stack>
			</ThemeProvider>
		</AppProviders>
	);
}
