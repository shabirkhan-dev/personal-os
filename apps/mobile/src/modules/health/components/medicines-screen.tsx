import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { newMedicineId, removeMedicine, saveMedicine } from "../data/health-actions";
import { allowMedicineReminders } from "../services/medicine-reminders";
import { useHealthToday } from "../hooks/use-health";
import { adherence, daysLeft, type Medicine } from "../lib/health-model";
import { Card } from "./health-cards";
import { HealthScreen } from "./health-screen";

/** The usual times; a medicine can take any mix of them. */
const SLOTS = [
	{ minutes: 8 * 60, label: "Morning · 08:00" },
	{ minutes: 13 * 60, label: "Afternoon · 13:00" },
	{ minutes: 20 * 60, label: "Evening · 20:00" },
	{ minutes: 22 * 60, label: "Night · 22:00" },
] as const;

/** Every medicine: when you take it, how many are left, and how the last week went. */
export function MedicinesScreen() {
	const { data, now } = useHealthToday();
	const [editing, setEditing] = useState<{ medicine: Medicine | null } | null>(null);
	const active = data.medicines.filter((medicine) => medicine.active);
	const stopped = data.medicines.filter((medicine) => !medicine.active);
	const week = adherence(data.medicines, data.doses, now, 7);

	return (
		<HealthScreen
			action={{
				icon: "Line/Plus",
				label: "Add a medicine",
				onPress: () => setEditing({ medicine: null }),
			}}
		>
			<ScreenTitle
				eyebrow={week === null ? "Medicines" : `Last 7 days · ${Math.round(week * 100)}% taken`}
				title="Medicines"
			/>
			{data.loading ? (
				<SkeletonList count={2} label="your medicines" />
			) : data.medicines.length === 0 ? (
				<EmptyCard
					icon="Clock"
					title="No medicines yet"
					body="Add what you take and when. You get a reminder at each time and a heads-up before you run out."
				>
					<PillButton label="Add a medicine" onPress={() => setEditing({ medicine: null })} />
				</EmptyCard>
			) : (
				<>
					<MedicineList medicines={active} onEdit={(medicine) => setEditing({ medicine })} />
					{stopped.length > 0 ? (
						<>
							<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
								Stopped
							</PoText>
							<MedicineList medicines={stopped} onEdit={(medicine) => setEditing({ medicine })} />
						</>
					) : null}
				</>
			)}
			<MedicineSheet
				visible={editing !== null}
				medicine={editing?.medicine ?? null}
				onClose={() => setEditing(null)}
			/>
		</HealthScreen>
	);
}

function MedicineList({
	medicines,
	onEdit,
}: {
	medicines: readonly Medicine[];
	onEdit: (medicine: Medicine) => void;
}) {
	const { colors } = usePoTheme();
	if (medicines.length === 0) return null;
	return (
		<Card>
			{medicines.map((medicine) => {
				const left = daysLeft(medicine);
				return (
					<Pressable
						key={medicine.id}
						accessibilityRole="button"
						onPress={() => onEdit(medicine)}
						style={({ pressed }) => [
							styles.row,
							pressed ? { backgroundColor: colors.bgHover } : null,
						]}
					>
						<View style={styles.flex}>
							<PoText variant="row15">{medicine.name}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{[medicine.dose, medicine.times.map(clockOf).join(", ") || "No times set"]
									.filter(Boolean)
									.join(" · ")}
							</PoText>
						</View>
						{left !== null ? (
							<PoText variant="meta13" tone={left <= 5 ? "textDanger" : "textTertiary"}>
								{left <= 0 ? "Out" : `${left} ${left === 1 ? "day" : "days"} left`}
							</PoText>
						) : null}
					</Pressable>
				);
			})}
		</Card>
	);
}

function MedicineSheet({
	visible,
	medicine,
	onClose,
}: {
	visible: boolean;
	medicine: Medicine | null;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [dose, setDose] = useState("");
	const [times, setTimes] = useState<number[]>([8 * 60]);
	const [stock, setStock] = useState("");
	const [active, setActive] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setName(medicine?.name ?? "");
		setDose(medicine?.dose ?? "");
		setTimes(medicine?.times ?? [8 * 60]);
		setStock(
			medicine?.stock === null || medicine?.stock === undefined ? "" : String(medicine.stock),
		);
		setActive(medicine?.active ?? true);
		setError(null);
	}, [visible, medicine]);

	const toggleTime = (minutes: number) =>
		setTimes((current) =>
			current.includes(minutes)
				? current.filter((item) => item !== minutes)
				: [...current, minutes].sort((a, b) => a - b),
		);

	const save = async () => {
		if (!name.trim()) {
			setError("Add the medicine's name.");
			return;
		}
		const count = stock.trim() ? Number(stock) : null;
		if (count !== null && (!Number.isInteger(count) || count < 0)) {
			setError("Pills left is a whole number, like 30.");
			return;
		}
		try {
			await saveMedicine({
				id: medicine?.id ?? newMedicineId(),
				name: name.trim(),
				dose: dose.trim(),
				times,
				stock: count,
				active,
				startedOn: medicine?.startedOn ?? dayKey(),
				note: medicine?.note ?? "",
			});
			haptics.success();
			// Reminders need permission; asked the first time a medicine has a time.
			if (times.length > 0 && active) {
				allowMedicineReminders().catch((caught: unknown) =>
					console.warn("[health] could not ask for notifications", caught),
				);
			}
			onClose();
		} catch (caught) {
			console.error("[health] could not save the medicine", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	const remove = () => {
		if (!medicine) return;
		showDialog(
			`Delete ${medicine.name}?`,
			"Its reminders stop. Doses already logged stay in your history.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						void removeMedicine(medicine.id).catch((caught: unknown) =>
							console.error("[health] could not delete the medicine", caught),
						);
						onClose();
					},
				},
			],
		);
	};

	return (
		<Sheet
			visible={visible}
			title={medicine ? "Edit medicine" : "Add a medicine"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<TextField label="Name" value={name} onChangeText={setName} placeholder="Metformin" />
			<TextField label="Dose" value={dose} onChangeText={setDose} placeholder="500 mg, 1 tablet" />
			<View style={styles.group}>
				<PoText variant="meta13" tone="textSecondary">
					When you take it
				</PoText>
				<View style={styles.chips}>
					{SLOTS.map((slot) => (
						<FilterChip
							key={slot.minutes}
							label={slot.label}
							selected={times.includes(slot.minutes)}
							onPress={() => toggleTime(slot.minutes)}
						/>
					))}
				</View>
				<PoText variant="meta13" tone="textTertiary">
					{times.length
						? `Reminders at ${times.map(clockOf).join(", ")}`
						: "No reminders: tap a time"}
				</PoText>
			</View>
			<TextField
				label="Pills left (optional)"
				value={stock}
				onChangeText={setStock}
				keyboardType="number-pad"
				placeholder="30"
			/>
			<View style={styles.toggleRow}>
				<PoText variant="row15" style={styles.flex}>
					Taking it now
				</PoText>
				<Toggle value={active} onChange={setActive} accessibilityLabel="Taking it now" />
			</View>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			{medicine ? <PillButton label="Delete" variant="danger" onPress={remove} /> : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pad: { paddingHorizontal: 4 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 8,
		borderRadius: 12,
	},
	group: { gap: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
