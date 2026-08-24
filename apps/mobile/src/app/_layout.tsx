import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppProviders } from "@/components/providers";
import { useAuth } from "@/modules/auth";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
	initialRouteName: "(modules)",
};

export default function RootLayout() {
	return (
		<AppProviders>
			<RootNavigator />
		</AppProviders>
	);
}

function RootNavigator() {
	const { loading } = useAuth();

	// Reveal the app only after the session bootstrap has resolved so the first
	// visible frame already reflects the guarded route decision.
	useEffect(() => {
		if (!loading) SplashScreen.hideAsync().catch(() => undefined);
	}, [loading]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(modules)" />
			<Stack.Screen name="(auth)" />
		</Stack>
	);
}
