import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function HeartRateWidget() {
	const chartData = [
		{ h: 30, offset: 20 },
		{ h: 40, offset: 15 },
		{ h: 25, offset: 25 },
		{ h: 50, offset: 10, highlight: NeonColors.accent.purple },
		{ h: 35, offset: 20 },
		{ h: 45, offset: 15, highlight: NeonColors.accent.orange },
		{ h: 60, offset: 5 },
		{ h: 40, offset: 20 },
		{ h: 30, offset: 25 },
		{ h: 55, offset: 10, highlight: NeonColors.accent.green },
		{ h: 40, offset: 15 },
	];

	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard>
				<View style={styles.header}>
					<Text style={styles.timeLabel}>TODAY 11:26 PM</Text>
					<Icon icon={FavouriteIcon} size={24} color={NeonColors.text.primary} strokeWidth={1.5} />
				</View>

				<View style={styles.mainValue}>
					<Text style={styles.bpm}>
						72 <Text style={styles.unit}>BPM</Text>
					</Text>
				</View>

				<View style={styles.metaRow}>
					<View style={styles.metaItem}>
						<View style={styles.metaHeader}>
							<View style={[styles.dot, { backgroundColor: NeonColors.accent.purple }]} />
							<Text style={styles.metaLabel}>MIN</Text>
						</View>
						<Text style={styles.metaValue}>51 BPM</Text>
					</View>
					<View style={styles.metaItem}>
						<View style={styles.metaHeader}>
							<View style={[styles.dot, { backgroundColor: NeonColors.accent.orange }]} />
							<Text style={styles.metaLabel}>PEAK</Text>
						</View>
						<Text style={styles.metaValue}>97 BPM</Text>
					</View>
				</View>

				{/* Complex Range Chart */}
				<View style={styles.chartContainer}>
					<View style={styles.barsRow}>
						{chartData.map((d, i) => (
							<View key={`bar-${i}`} style={styles.barColumn}>
								<View
									style={[
										styles.bar,
										{ height: d.h, marginTop: d.offset, backgroundColor: d.highlight || "#333333" },
									]}
								>
									{d.highlight && (
										<View style={[styles.glowDot, { backgroundColor: d.highlight }]} />
									)}
								</View>
							</View>
						))}
					</View>
					<View style={styles.timeline}>
						<Text style={styles.timeText}>12AM</Text>
						<Text style={styles.timeText}>6AM</Text>
						<Text style={styles.timeText}>12PM</Text>
						<Text style={styles.timeText}>6PM</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	timeLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
	},
	mainValue: {
		marginBottom: 20,
	},
	bpm: {
		color: NeonColors.text.primary,
		fontSize: 56,
		fontWeight: "300",
	},
	unit: {
		fontSize: 20,
		color: NeonColors.text.secondary,
	},
	metaRow: {
		flexDirection: "row",
		gap: 40,
		marginBottom: 32,
	},
	metaItem: {
		gap: 4,
	},
	metaHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	metaLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
	},
	metaValue: {
		color: NeonColors.text.primary,
		fontSize: 18,
		fontWeight: "500",
		paddingLeft: 14,
	},
	chartContainer: {
		height: 100,
		justifyContent: "flex-end",
	},
	barsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		height: 80,
		marginBottom: 8,
	},
	barColumn: {
		flex: 1,
		alignItems: "center",
	},
	bar: {
		width: 4,
		borderRadius: 2,
		position: "relative",
		alignItems: "center",
	},
	glowDot: {
		position: "absolute",
		top: -4,
		width: 6,
		height: 6,
		borderRadius: 3,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 4,
		elevation: 5,
	},
	timeline: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 4,
	},
	timeText: {
		color: NeonColors.text.muted,
		fontSize: 10,
		fontWeight: "600",
	},
});
