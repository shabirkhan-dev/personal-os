import type { ColorTokens } from "@personal-os/tokens";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { useMicPermission } from "@/modules/onboarding/hooks/use-mic-permission";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import type { ConnectionId } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

type Tone = keyof ColorTokens;

const healthFills: readonly { label: string; icon: IconName; tone: Tone }[] = [
	{ label: "Steps", icon: "Footsteps", tone: "statusSuccess" },
	{ label: "Sleep", icon: "Moon", tone: "statusViolet" },
	{ label: "Heart rate", icon: "Heart", tone: "statusDanger" },
	{ label: "Workouts", icon: "Dumbbell", tone: "statusDanger" },
];

const connections: readonly {
	id: ConnectionId;
	title: string;
	meta: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
}[] = [
	{
		id: "calendar",
		title: "Calendar",
		meta: "Meetings appear in Upcoming",
		icon: "Filled/Calendar",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	},
	{
		id: "smartwatch",
		title: "Smartwatch",
		meta: "Live heart rate and workouts",
		icon: "Clock",
		iconTone: "textPrimary",
		tileTone: "bgSubtle",
	},
	{
		id: "bank-sms",
		title: "Bank SMS",
		meta: "Auto-log spending in PKR",
		icon: "Wallet",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
	},
	{
		id: "microphone",
		title: "Microphone",
		meta: "Talk instead of typing",
		icon: "Mic",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
	},
];

const HEALTH_NAME = Platform.OS === "ios" ? "Apple Health" : "Health Connect";

/** 13 Setup 6 · Connect your devices. Only the microphone works today; the rest say so. */
export default function ConnectScreen() {
	const { colors } = usePoTheme();
	const micOn = useOnboardingStore((state) => state.connections.microphone);
	const toggleConnection = useOnboardingStore((state) => state.toggleConnection);
	const mic = useMicPermission();

	// The store mirrors the real permission, which can change in Settings.
	useEffect(() => {
		if (mic.state === "unknown") return;
		if ((mic.state === "granted") !== micOn) toggleConnection("microphone");
	}, [mic.state, micOn, toggleConnection]);

	const allowMic = async () => {
		haptics.select();
		try {
			await mic.request();
		} catch (error) {
			console.error("Microphone permission request failed", error);
		}
	};

	return (
		<SetupFrame
			step={6}
			route={onboardingRoutes.connect}
			title="Connect your devices"
			body={["Let Personal OS fill itself in. You stay in control."]}
			gap={18}
		>
			<View
				accessible
				accessibilityLabel={`${HEALTH_NAME}, coming soon`}
				style={[
					styles.health,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={styles.healthTop}>
					<View style={[styles.tile52, { backgroundColor: colors.bgSurface }]}>
						<Icon name="Heart" color={colors.statusDanger} />
					</View>
					<View style={styles.flex}>
						<View style={styles.nameRow}>
							<PoText variant="title18">{HEALTH_NAME}</PoText>
						</View>
						<PoText variant="meta13" tone="textSecondary">
							Coming in an update
						</PoText>
					</View>
					<Soon />
				</View>
				<View style={styles.fills}>
					{healthFills.map((fill) => (
						<View key={fill.label} style={[styles.fill, { backgroundColor: colors.bgSubtle }]}>
							<Icon name={fill.icon} size={14} color={colors[fill.tone]} />
							<PoText variant="meta13">{fill.label}</PoText>
						</View>
					))}
				</View>
			</View>
			<View style={styles.gap18} />
			<View style={styles.labelRow}>
				<PoText variant="eyebrow11" tone="textSecondary">
					More connections
				</PoText>
				<PoText variant="eyebrow11" tone="textTertiary">
					{micOn ? "Microphone on" : "More coming soon"}
				</PoText>
			</View>
			<View style={styles.gap10} />
			<View
				style={[
					styles.list,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{connections.map((item, index) => {
					return (
						<View
							key={item.id}
							style={[
								styles.row,
								index < connections.length - 1
									? { borderBottomWidth: 1, borderBottomColor: colors.borderDefault }
									: null,
							]}
						>
							<View style={[styles.tile40, { backgroundColor: colors[item.tileTone] }]}>
								<Icon name={item.icon} color={colors[item.iconTone]} />
							</View>
							<View style={styles.flexGap}>
								<PoText variant="row15">{item.title}</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{item.meta}
								</PoText>
							</View>
							{item.id !== "microphone" ? (
								<Soon />
							) : micOn ? (
								<Checkbox checked size={24} />
							) : mic.state === "unavailable" ? (
								<Soon />
							) : (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={
										mic.state === "blocked" ? "Open Settings" : "Allow microphone"
									}
									onPress={() => void allowMic()}
									style={({ pressed }) => [
										styles.action,
										{
											backgroundColor: pressed ? colors.bgSelected : colors.bgSubtle,
											borderColor: colors.borderDefault,
										},
									]}
								>
									<PoText variant="meta13">{mic.state === "blocked" ? "Settings" : "Allow"}</PoText>
								</Pressable>
							)}
						</View>
					);
				})}
			</View>
			<View style={styles.gap12} />
			<View style={styles.privacy}>
				<Icon name="Filled/Sparkle" size={14} color={colors.textTertiary} />
				<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
					Private to you. Disconnect anytime in Profile.
				</PoText>
			</View>
		</SetupFrame>
	);
}

function Soon() {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.tag, { backgroundColor: colors.bgSubtle }]}>
			<PoText variant="eyebrow11" tone="textSecondary">
				Soon
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 2 },
	flexGap: { flex: 1, gap: 2 },
	gap18: { height: 18 },
	gap10: { height: 10 },
	gap12: { height: 12 },
	health: { padding: 16, gap: 14, borderRadius: 28, borderWidth: 1 },
	healthTop: { flexDirection: "row", alignItems: "center", gap: 12 },
	tile52: {
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
	},
	nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
	fills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	fill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingLeft: 10,
		paddingRight: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 6,
	},
	list: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 28, borderWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	tile40: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	action: {
		height: 36,
		paddingHorizontal: 16,
		borderRadius: 18,
		borderWidth: 1,
		justifyContent: "center",
	},
	privacy: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
});
