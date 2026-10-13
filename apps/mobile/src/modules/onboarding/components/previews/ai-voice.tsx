import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

const inputModes: readonly { icon: IconName; label: string }[] = [
	{ icon: "Mic", label: "Voice" },
	{ icon: "Keyboard", label: "Type" },
	{ icon: "Filled/Scan", label: "Scan receipt" },
];

/** Frame 04 preview: "Hey OS" chip, Ask Bar, AI reply and input modes. */
export function AiVoicePreview() {
	const { colors } = usePoTheme();
	const surface = { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault };

	return (
		<View style={styles.stack}>
			<Animated.View entering={FadeInDown.duration(380)} style={[styles.hey, surface]}>
				<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
				<PoText variant="meta13">“Hey OS” · works with the app closed</PoText>
			</Animated.View>
			<Animated.View
				entering={FadeInDown.duration(380).delay(80)}
				style={[styles.ask, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Filled/Sparkle" color={colors.textTertiary} />
				<PoText variant="body15" style={styles.flex} numberOfLines={1}>
					Add a meeting with Ali at 9:20
				</PoText>
				<View style={[styles.send, { backgroundColor: colors.bgInverse }]}>
					<Icon name="Line/Arrow up" color={colors.textInverse} />
				</View>
			</Animated.View>
			<Animated.View entering={FadeInDown.duration(380).delay(160)} style={styles.reply}>
				<View style={styles.from}>
					<Icon name="Filled/Sparkle" size={14} color={colors.textTertiary} />
					<PoText variant="eyebrow11" tone="textTertiary">
						Personal OS
					</PoText>
				</View>
				<PoText variant="body15">
					Done. Added for 09:20 and moved your walk so nothing overlaps.
				</PoText>
				<View style={styles.pills}>
					<View style={[styles.summary, surface]}>
						<Icon name="Filled/Calendar" color={colors.accentDefault} />
						<PoText variant="title18">Calendar</PoText>
						<PoText variant="title18" tone="textSuccess">
							+1
						</PoText>
					</View>
					<View style={[styles.modes, surface]}>
						{inputModes.map((mode, index) => (
							<View
								key={mode.label}
								accessibilityLabel={mode.label}
								style={[styles.mode, index === 0 ? { backgroundColor: colors.bgHover } : null]}
							>
								<Icon
									name={mode.icon}
									color={index === 0 ? colors.textPrimary : colors.textSecondary}
								/>
							</View>
						))}
					</View>
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	stack: { gap: 14 },
	flex: { flex: 1 },
	hey: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 12,
		paddingRight: 14,
		paddingVertical: 7,
		borderRadius: 16,
		borderWidth: 1,
	},
	ask: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingLeft: 18,
		paddingRight: 6,
		borderRadius: 26,
	},
	send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	reply: { gap: 10, paddingTop: 6, paddingHorizontal: 8 },
	from: { flexDirection: "row", alignItems: "center", gap: 8 },
	pills: { flexDirection: "row", gap: 8 },
	summary: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingLeft: 16,
		paddingRight: 18,
		borderRadius: 26,
		borderWidth: 1,
	},
	modes: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 6,
		borderRadius: 26,
		borderWidth: 1,
	},
	mode: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
