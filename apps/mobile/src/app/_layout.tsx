import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppProviders } from "@/components/providers";
import { useAuth } from "@/modules/auth";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
	initialRouteName: "(modules)",
};

export default function RootLayout() {
	return (
		<AppProviders>
			<AnimatedSplashOverlay />
			<SplashScreenController />
			<RootNavigator />
		</AppProviders>
	);
}

function SplashScreenController() {
	const { loading } = useAuth();
	if (!loading) {
		SplashScreen.hideAsync().catch(() => undefined);
	}
	return null;
}

function RootNavigator() {
	const { user, loading } = useAuth();
	const signedIn = !!user;

	if (loading) {
		return null;
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={signedIn}>
				<Stack.Screen name="(modules)" />
			</Stack.Protected>
			<Stack.Protected guard={!signedIn}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
		</Stack>
	);
}
