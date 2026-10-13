import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoMark } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

/** Placeholder home until the Figma "Home" page is built. */
export default function HomeScreen() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const name = useOnboardingStore((state) => state.name);
	const resetAnswers = useOnboardingStore((state) => state.reset);
	const restart = useOnboardingProgress((state) => state.restart);

	const replayOnboarding = async () => {
		resetAnswers();
		await restart();
	};

	return (
		<View
			style={[
				styles.root,
				{
					backgroundColor: colors.bgApp,
					paddingTop: insets.top + 24,
					paddingBottom: Math.max(34, insets.bottom),
				},
			]}
		>
			<View style={styles.center}>
				<LogoMark size={56} />
				<PoText variant="title30">
					{name.trim() ? `Hi, ${name.trim().split(" ")[0]}` : "Personal OS"}
				</PoText>
				<PoText variant="body15" tone="textSecondary" style={styles.text}>
					Your home is on its way. Onboarding is set up; the Home screen comes next.
				</PoText>
			</View>
			<PillButton variant="secondary" label="Replay onboarding" onPress={replayOnboarding} />
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, paddingHorizontal: 16 },
	center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
	text: { textAlign: "center" },
});
