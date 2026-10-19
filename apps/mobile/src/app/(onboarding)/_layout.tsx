import { Stack } from "expo-router";
import { Platform } from "react-native";
import { RouteError } from "@/components/route-error";
import { useDraftAutosave } from "@/modules/onboarding/store/use-draft-autosave";
import { usePoTheme } from "@/theme";

/** A setup screen that fails to render shows a retry instead of closing the app. */
export const ErrorBoundary = RouteError;

export default function OnboardingLayout() {
	const { colors } = usePoTheme();
	useDraftAutosave();

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				// Native gets the slide; web previews render without stack animation.
				animation: Platform.OS === "web" ? "none" : "slide_from_right",
				contentStyle: { backgroundColor: colors.bgApp },
			}}
		>
			<Stack.Screen name="splash" options={{ animation: "fade" }} />
			<Stack.Screen name="welcome-modules" options={{ animation: "fade" }} />
			<Stack.Screen name="building" options={{ animation: "fade", gestureEnabled: false }} />
			<Stack.Screen name="plan-reveal" options={{ animation: "fade" }} />
			<Stack.Screen name="all-set" options={{ animation: "fade", gestureEnabled: false }} />
		</Stack>
	);
}
