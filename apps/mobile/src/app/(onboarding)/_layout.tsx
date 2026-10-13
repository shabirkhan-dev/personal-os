import { Stack } from "expo-router";
import { Platform } from "react-native";
import { usePoTheme } from "@/theme";

export default function OnboardingLayout() {
	const { colors } = usePoTheme();

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
