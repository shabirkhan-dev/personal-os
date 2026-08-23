import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppProviders } from "@/components/providers";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
	initialRouteName: "(modules)",
};

export default function RootLayout() {
	useEffect(() => {
		SplashScreen.hideAsync().catch(() => undefined);
	}, []);

	return (
		<AppProviders>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(modules)" />
				<Stack.Screen name="(auth)" />
			</Stack>
		</AppProviders>
	);
}
