import { elevation } from "@personal-os/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Glow } from "@/components/ui/glow";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Avatar } from "@/modules/onboarding/components/avatar";
import { OnboardingScreen } from "@/modules/onboarding/components/onboarding-screen";
import { SetupTop } from "@/modules/onboarding/components/top-bars";
import { moduleOptions } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { pop, rise, toShadowStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 18 All set: the member card, then into the app. */
export default function AllSetScreen() {
	const { colors } = usePoTheme();
	const name = useOnboardingStore((state) => state.name);
	const modules = useOnboardingStore((state) => state.modules);
	const complete = useOnboardingStore((state) => state.complete);
	const markCompleted = useOnboardingProgress((state) => state.markCompleted);
	const [joined] = useState(() => new Date());

	const openOs = async () => {
		complete();
		haptics.success();
		await markCompleted();
		router.replace("/");
	};

	return (
		<OnboardingScreen glow="statusViolet">
			<SetupTop onBack={() => router.back()} />
			<View style={styles.spacer} />
			<Animated.View entering={rise()} style={styles.text}>
				<PoText variant="eyebrow11" tone="textTertiary">
					All set
				</PoText>
				<PoText variant="title30">Welcome to your OS</PoText>
				<PoText variant="body15" tone="textSecondary" style={styles.center}>
					Here's your card. Your plan, modules and devices live here.
				</PoText>
			</Animated.View>
			<View style={styles.gap26} />
			<Animated.View
				entering={pop(160)}
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					toShadowStyle(elevation.floating),
				]}
			>
				<View style={styles.clip}>
					<Glow
						tone="statusViolet"
						width={300}
						height={180}
						left={59}
						top={-111}
						blur={70}
						strength="member"
					/>
					<View style={[styles.tab, { backgroundColor: colors.bgSubtle }]}>
						<View style={styles.inline8}>
							<View style={[styles.dot8, { backgroundColor: colors.accentDefault }]} />
							<PoText variant="row15">Personal OS</PoText>
						</View>
						<PoText variant="eyebrow11" tone="textTertiary">
							Member
						</PoText>
					</View>
					<View
						style={[
							styles.pocket,
							{ backgroundColor: colors.bgSurface },
							toShadowStyle(elevation.pocket),
						]}
					>
						<View style={[styles.stitch, { borderColor: colors.borderDefault }]}>
							<View style={styles.who}>
								<Avatar name={name} size={52} />
								<View style={styles.whoText}>
									<PoText variant="title18" numberOfLines={1}>
										{name.trim() || "You"}
									</PoText>
									<PoText variant="meta13" tone="textSecondary">
										{`Member since ${MONTHS[joined.getMonth()]} ${joined.getFullYear()}`}
									</PoText>
								</View>
							</View>
							<View style={styles.bottom}>
								<View style={styles.inline6}>
									{modules.map((id) => {
										const option = moduleOptions.find((item) => item.id === id);
										return option ? (
											<View
												key={id}
												style={[styles.dot10, { backgroundColor: colors[option.iconTone] }]}
											/>
										) : null;
									})}
									<PoText variant="meta13" tone="textSecondary">
										{`${modules.length} ${modules.length === 1 ? "module" : "modules"}`}
									</PoText>
								</View>
								<PoText variant="mono13" tone="textTertiary">
									OS · 0001
								</PoText>
							</View>
						</View>
					</View>
				</View>
			</Animated.View>
			<View style={styles.gap28} />
			<View style={styles.footer}>
				<PillButton label="Open my OS" onPress={openOs} />
				<PoText variant="meta13" tone="textTertiary" style={styles.center}>
					Add it to Apple Wallet or share it
				</PoText>
			</View>
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1 },
	text: { alignItems: "center", gap: 8 },
	center: { textAlign: "center" },
	gap26: { height: 26 },
	gap28: { height: 28 },
	card: { height: 232, borderRadius: 32, borderWidth: 1 },
	clip: { flex: 1, borderRadius: 31, overflow: "hidden" },
	tab: {
		position: "absolute",
		left: 12,
		right: 12,
		top: 12,
		height: 70,
		paddingTop: 16,
		paddingHorizontal: 18,
		borderRadius: 22,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	inline8: { flexDirection: "row", alignItems: "center", gap: 8 },
	inline6: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot8: { width: 8, height: 8, borderRadius: 4 },
	dot10: { width: 10, height: 10, borderRadius: 5 },
	pocket: { position: "absolute", left: -1, right: -1, top: 62, height: 168, borderRadius: 30 },
	stitch: {
		position: "absolute",
		left: 12,
		right: 12,
		top: 12,
		height: 144,
		padding: 16,
		borderRadius: 22,
		borderWidth: 1.5,
		borderStyle: "dashed",
		justifyContent: "space-between",
	},
	who: { flexDirection: "row", alignItems: "center", gap: 12 },
	whoText: { flex: 1, gap: 2 },
	bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	footer: { gap: 8 },
});
