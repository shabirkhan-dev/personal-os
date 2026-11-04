import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { newMedicineId, removeMedicine, saveMedicine } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import {
	adherence,
	daysLeft,
	MEDICINE_FORM_LABELS,
	MEDICINE_FORMS,
	type Medicine,
	type MedicineForm,
	type MedicineType,
	WITH_FOOD,
	WITH_FOOD_LABELS,
	type WithFood,
} from "../lib/health-model";
import { forgetHealthPhoto } from "../services/health-photo";
import { allowMedicineReminders } from "../services/medicine-reminders";
import { Card, CardHead } from "./health-cards";
import { HealthScreen } from "./health-screen";
import { PhotoField, PhotoThumb } from "./photo-field";

const TYPES = [
	{ value: "medicine", label: "Medicine" },
	{ value: "supplement", label: "Supplement" },
] as const;

/** "Tablet · 500 mg · With food": what's worth seeing at a glance. */
export function medicineLine(medicine: Medicine): string {
	return [
		medicine.dose || MEDICINE_FORM_LABELS[medicine.form],
		medicine.withFood === "any" ? "" : WITH_FOOD_LABELS[medicine.withFood],
		medicine.purpose ? `for ${medicine.purpose}` : "",
	]
		.filter(Boolean)
		.join(" · ");
}

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
	const [editing, setEditing] = useState<{
		medicine: Medicine | null;
		type: MedicineType;
	} | null>(null);
	const of = (type: MedicineType) =>
		data.medicines.filter((medicine) => medicine.active && medicine.type === type);
	const stopped = data.medicines.filter((medicine) => !medicine.active);
	const edit = (medicine: Medicine) => setEditing({ medicine, type: medicine.type });
	const add = (type: MedicineType) => setEditing({ medicine: null, type });
	const week = adherence(data.medicines, data.doses, now, 7);

	return (
		<HealthScreen
			action={{
				icon: "Line/Plus",
				label: "Add a medicine or supplement",
				onPress: () => add("medicine"),
			}}
		>
			<ScreenTitle
				eyebrow={week === null ? "What you take" : `Last 7 days · ${Math.round(week * 100)}% taken`}
				title="Medicines and supplements"
			/>
			{data.loading ? (
				<SkeletonList count={2} label="your medicines" />
			) : data.medicines.length === 0 ? (
				<EmptyCard
					icon="Clock"
					title="Nothing here yet"
					body="Add what your doctor prescribed and the supplements you take, like vitamin D or omega 3. You get a reminder at each time and a heads-up before you run out."
				>
					<PillButton label="Add a medicine" onPress={() => add("medicine")} />
					<PillButton
						label="Add a supplement"
						variant="secondary"
						onPress={() => add("supplement")}
					/>
				</EmptyCard>
			) : (
				<>
					<MedicineList
						title="Medicines"
						medicines={of("medicine")}
						onEdit={edit}
						onAdd={() => add("medicine")}
					/>
					<MedicineList
						title="Supplements"
						medicines={of("supplement")}
						onEdit={edit}
						onAdd={() => add("supplement")}
					/>
					{stopped.length > 0 ? (
						<MedicineList title="Stopped" medicines={stopped} onEdit={edit} />
					) : null}
				</>
			)}
			<MedicineSheet
				visible={editing !== null}
				medicine={editing?.medicine ?? null}
				type={editing?.type ?? "medicine"}
				onClose={() => setEditing(null)}
			/>
		</HealthScreen>
	);
}

function MedicineList({
	title,
	medicines,
	onEdit,
	onAdd,
}: {
	title: string;
	medicines: readonly Medicine[];
	onEdit: (medicine: Medicine) => void;
	onAdd?: () => void;
}) {
	const { colors } = usePoTheme();
	if (medicines.length === 0 && !onAdd) return null;
	return (
		<Card>
			<CardHead title={title} right={onAdd ? "Add" : undefined} onPress={onAdd} />
			{medicines.length === 0 ? (
				<PoText variant="meta13" tone="textTertiary">
					{title === "Supplements"
						? "Vitamins, minerals, protein: anything you take on your own."
						: "Anything a doctor prescribed."}
				</PoText>
			) : null}
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
						<PhotoThumb uri={medicine.photo} size={44} icon="Drop" />
						<View style={styles.flex}>
							<PoText variant="row15" numberOfLines={1}>
								{medicine.name}
							</PoText>
							<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
								{medicineLine(medicine)}
							</PoText>
							<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
								{medicine.times.map(clockOf).join(", ") || "When needed"}
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
	type: startType,
	onClose,
}: {
	visible: boolean;
	medicine: Medicine | null;
	type: MedicineType;
	onClose: () => void;
}) {
	const [type, setType] = useState<MedicineType>(startType);
	const [name, setName] = useState("");
	const [dose, setDose] = useState("");
	const [form, setForm] = useState<MedicineForm>("tablet");
	const [purpose, setPurpose] = useState("");
	const [withFood, setWithFood] = useState<WithFood>("any");
	const [photo, setPhoto] = useState<string | null>(null);
	const [times, setTimes] = useState<number[]>([8 * 60]);
	const [stock, setStock] = useState("");
	const [active, setActive] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setType(medicine?.type ?? startType);
		setName(medicine?.name ?? "");
		setDose(medicine?.dose ?? "");
		setForm(medicine?.form ?? (startType === "supplement" ? "capsule" : "tablet"));
		setPurpose(medicine?.purpose ?? "");
		setWithFood(medicine?.withFood ?? "any");
		setPhoto(medicine?.photo ?? null);
		setTimes(medicine?.times ?? [8 * 60]);
		setStock(
			medicine?.stock === null || medicine?.stock === undefined ? "" : String(medicine.stock),
		);
		setActive(medicine?.active ?? true);
		setError(null);
	}, [visible, medicine, startType]);

	const toggleTime = (minutes: number) =>
		setTimes((current) =>
			current.includes(minutes)
				? current.filter((item) => item !== minutes)
				: [...current, minutes].sort((a, b) => a - b),
		);

	const save = async () => {
		if (!name.trim()) {
			setError(`Add the ${type}'s name.`);
			return;
		}
		const count = stock.trim() ? Number(stock) : null;
		if (count !== null && (!Number.isInteger(count) || count < 0)) {
			setError("How many are left is a whole number, like 30.");
			return;
		}
		try {
			await saveMedicine({
				id: medicine?.id ?? newMedicineId(),
				type,
				name: name.trim(),
				dose: dose.trim(),
				form,
				purpose: purpose.trim(),
				withFood,
				photo,
				times,
				stock: count,
				active,
				startedOn: medicine?.startedOn ?? dayKey(),
				note: medicine?.note ?? "",
			});
			if (medicine?.photo && medicine.photo !== photo) forgetHealthPhoto(medicine.photo);
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
						void removeMedicine(medicine.id)
							.then(() => forgetHealthPhoto(medicine.photo))
							.catch((caught: unknown) =>
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
			title={
				medicine ? medicine.name : type === "supplement" ? "Add a supplement" : "Add a medicine"
			}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<SegmentedControl
				options={TYPES}
				value={type}
				onChange={setType}
				accessibilityLabel="Medicine or supplement"
			/>
			<PhotoField value={photo} onChange={setPhoto} shape="square" icon="Drop" />
			<TextField
				label="Name"
				value={name}
				onChangeText={setName}
				placeholder={type === "supplement" ? "Vitamin D3" : "Metformin"}
			/>
			<TextField
				label="Dose"
				value={dose}
				onChangeText={setDose}
				placeholder={type === "supplement" ? "2000 IU, 1 capsule" : "500 mg, 1 tablet"}
			/>
			<ChoiceChips
				label="Form"
				options={MEDICINE_FORMS.map((value) => ({ value, label: MEDICINE_FORM_LABELS[value] }))}
				value={form}
				onChange={setForm}
			/>
			<TextField
				label="What it's for (optional)"
				value={purpose}
				onChangeText={setPurpose}
				placeholder={type === "supplement" ? "Energy, bones" : "Blood pressure"}
			/>
			<ChoiceChips
				label="Food"
				options={WITH_FOOD.map((value) => ({ value, label: WITH_FOOD_LABELS[value] }))}
				value={withFood}
				onChange={setWithFood}
			/>
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
				label="How many left (optional)"
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
