import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { SelectCard } from "@/components/ui/select-card";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import type { ConnectionId } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

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
	action: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
}[] = [
	{
		id: "calendar",
		title: "Calendar",
		meta: "Meetings appear in Upcoming",
		action: "Connect",
		icon: "Filled/Calendar",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	},
	{
		id: "smartwatch",
		title: "Smartwatch",
		meta: "Live heart rate and workouts",
		action: "Connect",
		icon: "Clock",
		iconTone: "textPrimary",
		tileTone: "bgSubtle",
	},
	{
		id: "bank-sms",
		title: "Bank SMS",
		meta: "Auto-log spending in PKR",
		action: "Connect",
		icon: "Wallet",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
	},
	{
		id: "microphone",
		title: "Microphone",
		meta: "Needed for “Hey OS”",
		action: "Allow",
		icon: "Mic",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
	},
];

/** 13 Setup 6 · Connect your devices */
export default function ConnectScreen() {
	const { colors } = usePoTheme();
	const appleHealth = useOnboardingStore((state) => state.appleHealth);
	const connected = useOnboardingStore((state) => state.connections);
	const set = useOnboardingStore((state) => state.set);
	const toggleConnection = useOnboardingStore((state) => state.toggleConnection);
	const onCount = connections.filter((item) => connected[item.id]).length;

	return (
		<SetupFrame
			step={6}
			route={onboardingRoutes.connect}
			title="Connect your devices"
			body={["Let Personal OS fill itself in. You stay in control."]}
			gap={18}
		>
			<SelectCard
				selected={appleHealth}
				onPress={() => set("appleHealth", !appleHealth)}
				radius={28}
				accessibilityLabel="Apple Health"
				style={styles.health}
			>
				<View style={styles.healthTop}>
					<View style={[styles.tile52, { backgroundColor: colors.bgSurface }]}>
						<Icon name="Heart" color={colors.statusDanger} />
					</View>
					<View style={styles.flex}>
						<View style={styles.nameRow}>
							<PoText variant="title18">Apple Health</PoText>
							<View style={[styles.tag, { backgroundColor: colors.bgSurface }]}>
								<PoText variant="eyebrow11" tone="textSecondary">
									Recommended
								</PoText>
							</View>
						</View>
						<PoText variant="meta13" tone="textSecondary">
							{appleHealth ? "Connected · synced 2 min ago" : "Tap to connect"}
						</PoText>
					</View>
					<Checkbox checked={appleHealth} size={28} />
				</View>
				<View style={styles.fills}>
					{healthFills.map((fill) => (
						<View key={fill.label} style={[styles.fill, { backgroundColor: colors.bgSurface }]}>
							<Icon name={fill.icon} size={14} color={colors[fill.tone]} />
							<PoText variant="meta13">{fill.label}</PoText>
						</View>
					))}
				</View>
			</SelectCard>
			<View style={styles.gap18} />
			<View style={styles.labelRow}>
				<PoText variant="eyebrow11" tone="textSecondary">
					More connections
				</PoText>
				<PoText variant="eyebrow11" tone="textTertiary">
					{`${onCount} of ${connections.length} on`}
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
					const on = connected[item.id];
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
							{on ? (
								<Pressable
									accessibilityRole="checkbox"
									accessibilityLabel={`${item.title} connected`}
									accessibilityState={{ checked: true }}
									hitSlop={8}
									onPress={() => toggleConnection(item.id)}
								>
									<Checkbox checked size={24} />
								</Pressable>
							) : (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`${item.action} ${item.title}`}
									onPress={() => toggleConnection(item.id)}
									style={({ pressed }) => [
										styles.action,
										{
											backgroundColor: pressed ? colors.bgSelected : colors.bgSubtle,
											borderColor: colors.borderDefault,
										},
									]}
								>
									<PoText variant="meta13">{item.action}</PoText>
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

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 2 },
	flexGap: { flex: 1, gap: 2 },
	gap18: { height: 18 },
	gap10: { height: 10 },
	gap12: { height: 12 },
	health: { padding: 16, gap: 14 },
	healthTop: { flexDirection: "row", alignItems: "center", gap: 12 },
	tile52: {
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
	},
	nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
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
