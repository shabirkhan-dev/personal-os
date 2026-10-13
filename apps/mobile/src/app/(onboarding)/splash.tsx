import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { LogoMark } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { rise, usePoTheme } from "@/theme";

const SPLASH_MS = 1800;

/** 01 Splash */
export default function SplashScreen() {
	useEffect(() => {
		const timer = setTimeout(() => router.replace(onboardingRoutes.welcomeModules), SPLASH_MS);
		return () => clearTimeout(timer);
	}, []);

	return (
		<OnboardingScreen glow="accentDefault">
			<View style={styles.center}>
				<Animated.View entering={rise()} style={styles.brand}>
					<LogoMark size={72} />
					<View style={styles.words}>
						<PoText variant="title30">Personal OS</PoText>
						<PoText variant="body15" tone="textSecondary">
							Your life, in one place
						</PoText>
					</View>
					<Loader />
				</Animated.View>
			</View>
			<Animated.View entering={FadeIn.delay(300)} style={styles.maker}>
				<PoText variant="eyebrow11" tone="textTertiary">
					by RabtX
				</PoText>
			</Animated.View>
		</OnboardingScreen>
	);
}

function Loader() {
	const { colors } = usePoTheme();
	const tones = [colors.statusSuccess, colors.statusCaution, colors.statusViolet];

	return (
		<View style={styles.loader} accessibilityLabel="Loading">
			{tones.map((color, index) => (
				<LoaderDot key={color} color={color} index={index} />
			))}
		</View>
	);
}

function LoaderDot({ color, index }: { color: string; index: number }) {
	const opacity = useSharedValue(index === 1 ? 1 : 0.5);

	useEffect(() => {
		opacity.value = withDelay(
			index * 160,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 520, easing: Easing.inOut(Easing.sin) }),
					withTiming(0.5, { duration: 520, easing: Easing.inOut(Easing.sin) }),
				),
				-1,
			),
		);
	}, [index, opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
	return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	brand: { alignItems: "center", gap: 18 },
	words: { alignItems: "center", gap: 6 },
	loader: { width: 40, height: 22, flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	maker: { alignItems: "center" },
});
