import { Calendar01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";

export function SkincareWidget() {
	const routine = [
		{ name: "Cleanser", time: "08:00 AM", status: "Done", color: NeonColors.accent.blue },
		{ name: "Moisturizer", time: "08:15 AM", status: "Done", color: NeonColors.accent.green },
		{ name: "Sunscreen", time: "09:00 AM", status: "Pending", color: NeonColors.accent.orange },
	];

	return (
		<Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
			<NeonCard>
				<View style={styles.header}>
					<Text style={styles.label}>DAILY ROUTINE</Text>
					<Icon icon={SparklesIcon} size={18} color={NeonColors.accent.purple} />
				</View>

				<View style={styles.statusRow}>
					<Text style={styles.mainValue}>
						Morning <Text style={styles.unit}>Set</Text>
					</Text>
					<View style={styles.dateBadge}>
						<Icon icon={Calendar01Icon} size={12} color={NeonColors.text.secondary} />
						<Text style={styles.dateText}>May 7</Text>
					</View>
				</View>

				<View style={styles.list}>
					{routine.map((item) => (
						<View key={item.name} style={styles.item}>
							<View style={styles.itemLeft}>
								<View style={[styles.dot, { backgroundColor: item.color }]} />
								<View>
									<Text style={styles.itemName}>{item.name}</Text>
									<Text style={styles.itemTime}>{item.time}</Text>
								</View>
							</View>
							<View
								style={[
									styles.statusBadge,
									{
										backgroundColor:
											item.status === "Done" ? "rgba(0, 230, 118, 0.15)" : "rgba(255, 109, 0, 0.1)",
									},
								]}
							>
								<Text
									style={[
										styles.statusText,
										{
											color:
												item.status === "Done" ? NeonColors.accent.green : NeonColors.accent.orange,
										},
									]}
								>
									{item.status}
								</Text>
							</View>
						</View>
					))}
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
		marginBottom: 8,
	},
	label: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 2,
	},
	statusRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	mainValue: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	unit: {
		fontSize: 18,
		color: NeonColors.text.secondary,
	},
	dateBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: NeonColors.surface,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	dateText: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "600",
	},
	list: {
		gap: 16,
	},
	item: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	itemLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	dot: {
		width: 3,
		height: 24,
		borderRadius: 2,
	},
	itemName: {
		color: NeonColors.text.primary,
		fontSize: 15,
		fontWeight: "600",
	},
	itemTime: {
		color: NeonColors.text.secondary,
		fontSize: 12,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	statusText: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
	},
});
