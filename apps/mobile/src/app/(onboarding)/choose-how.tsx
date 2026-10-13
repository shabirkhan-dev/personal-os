import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SelectCard } from "@/components/ui/select-card";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { TextBlock } from "@/modules/onboarding/components/text-block";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

/** 06 Setup · Choose how */
export default function ChooseHowScreen() {
	const { colors } = usePoTheme();
	const path = useOnboardingStore((state) => state.path);
	const setAnswer = useOnboardingStore((state) => state.set);
	const talking = path === "talk";

	return (
		<OnboardingScreen
			glow="statusViolet"
			footer={
				<>
					<PillButton
						label={talking ? "Start talking" : "Start setup"}
						onPress={() =>
							router.push(talking ? onboardingRoutes.voice : onboardingRoutes.aboutYou)
						}
					/>
					<PoText variant="meta13" tone="textTertiary" style={styles.center}>
						You can edit anything after
					</PoText>
				</>
			}
		>
			<SetupTop onBack={() => router.back()} />
			<View style={styles.gap24} />
			<TextBlock
				eyebrow="Set up your OS"
				title="How do you want to start?"
				body={["Both get you the same plan. Talking is faster."]}
			/>
			<View style={styles.gap24} />
			<Animated.View entering={FadeInDown.duration(380).delay(120)}>
				<SelectCard
					selected={talking}
					onPress={() => setAnswer("path", "talk")}
					accessibilityLabel="Just talk"
					style={styles.card}
				>
					<View style={styles.top}>
						<View style={[styles.tile, { backgroundColor: colors.statusVioletSubtle }]}>
							<Icon name="Mic" color={colors.statusViolet} />
						</View>
						<View style={styles.right}>
							<View style={[styles.tag, { backgroundColor: colors.statusVioletSubtle }]}>
								<PoText variant="eyebrow11">Fastest</PoText>
							</View>
							<Checkbox checked={talking} size={28} />
						</View>
					</View>
					<View style={styles.text}>
						<PoText variant="title18">Just talk</PoText>
						<PoText variant="meta13" tone="textSecondary">
							Tell me about you and your day in about 30 seconds. I'll fill in everything.
						</PoText>
					</View>
					<View style={styles.example}>
						<PoText variant="eyebrow11" tone="textTertiary">
							Say:
						</PoText>
						<PoText variant="meta13">“I'm Shabir, 28, I wake at 6:30…”</PoText>
					</View>
				</SelectCard>
			</Animated.View>
			<View style={styles.gap12} />
			<Animated.View entering={FadeInDown.duration(380).delay(200)}>
				<SelectCard
					selected={!talking}
					onPress={() => setAnswer("path", "steps")}
					accessibilityLabel="Step by step"
					style={styles.card}
				>
					<View style={styles.top}>
						<View style={[styles.tile, { backgroundColor: colors.bgSubtle }]}>
							<Icon name="List" color={colors.textPrimary} />
						</View>
						<Checkbox checked={!talking} size={28} />
					</View>
					<View style={styles.text}>
						<PoText variant="title18">Step by step</PoText>
						<PoText variant="meta13" tone="textSecondary">
							8 quick questions. Tap, slide, done.
						</PoText>
					</View>
				</SelectCard>
			</Animated.View>
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	gap24: { height: 24 },
	gap12: { height: 12 },
	center: { textAlign: "center" },
	card: { padding: 18, gap: 14 },
	top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	tile: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
	right: { flexDirection: "row", alignItems: "center", gap: 8 },
	tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
	text: { gap: 4 },
	example: { flexDirection: "row", alignItems: "center", gap: 6 },
});
