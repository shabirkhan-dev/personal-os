import { PauseIcon, Settings02Icon, StopIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function RecorderWidget() {
	// Mock waveform heights
	const waveform = [10, 20, 15, 40, 60, 30, 80, 50, 40, 90, 30, 20, 10, 15, 25, 35, 15, 10];

	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard>
				{/* Waveform Visualizer */}
				<View style={styles.waveformContainer}>
					<View style={styles.waveformRow}>
						{waveform.map((h, i) => (
							<View
								key={`wave-${i}`}
								style={[
									styles.waveBar,
									{
										height: h,
										backgroundColor: i > 10 ? NeonColors.text.muted : NeonColors.text.primary,
									},
								]}
							/>
						))}
						<View style={styles.playhead} />
					</View>
					<View style={styles.waveformDotted} />
				</View>

				<View style={styles.infoRow}>
					<View style={styles.timeContainer}>
						<View style={styles.recordingDot} />
						<Text style={styles.time}>01:49</Text>
					</View>
					<View>
						<Text style={styles.statusLabel}>NEW AUDIO</Text>
						<Text style={styles.statusLabel}>RECORDING...</Text>
					</View>
				</View>

				{/* Controls */}
				<View style={styles.controls}>
					<Pressable style={styles.secondaryButton}>
						<Icon icon={Settings02Icon} size={20} color={NeonColors.text.primary} />
					</Pressable>

					<Pressable style={styles.mainButton}>
						<Icon
							icon={PauseIcon}
							size={24}
							color={NeonColors.text.primary}
							fill={NeonColors.text.primary}
						/>
					</Pressable>

					<Pressable style={styles.secondaryButton}>
						<Icon
							icon={StopIcon}
							size={20}
							color={NeonColors.text.primary}
							fill={NeonColors.text.primary}
						/>
					</Pressable>
				</View>
			</NeonCard>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	waveformContainer: {
		height: 100,
		justifyContent: "center",
		marginBottom: 20,
		position: "relative",
	},
	waveformRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	waveBar: {
		width: 2,
		borderRadius: 1,
	},
	playhead: {
		position: "absolute",
		left: "60%",
		top: 0,
		bottom: 0,
		width: 2,
		backgroundColor: NeonColors.accent.orange,
		zIndex: 10,
	},
	waveformDotted: {
		position: "absolute",
		left: "62%",
		right: 0,
		top: "50%",
		height: 1,
		borderStyle: "dotted",
		borderWidth: 1,
		borderColor: NeonColors.text.muted,
		borderRadius: 1,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 32,
	},
	timeContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	recordingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: NeonColors.accent.red,
	},
	time: {
		color: NeonColors.text.primary,
		fontSize: 36,
		fontWeight: "500",
		fontFamily: "monospace",
	},
	statusLabel: {
		color: NeonColors.text.secondary,
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 2,
		textAlign: "right",
	},
	controls: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 20,
	},
	mainButton: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: NeonColors.accent.red,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: NeonColors.accent.red,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 8,
	},
	secondaryButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#333333",
		justifyContent: "center",
		alignItems: "center",
	},
});
