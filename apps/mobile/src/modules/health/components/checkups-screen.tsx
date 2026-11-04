import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyCard, ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import { DateWheel } from "@/modules/onboarding/components/date-wheel";
import { usePoTheme } from "@/theme";
import { newCheckupId, removeCheckup, saveCheckup } from "../data/health-actions";
import { useHealthToday } from "../hooks/use-health";
import { CHECKUP_KINDS, CHECKUP_LABELS, type Checkup, type CheckupKind } from "../lib/health-model";
import { Card, CardHead, longDay, SmallButton } from "./health-cards";
import { HealthScreen } from "./health-screen";

const REPEATS = [
	{ value: "0", label: "Once" },
	{ value: "6", label: "Every 6 months" },
	{ value: "12", label: "Every year" },
	{ value: "24", label: "Every 2 years" },
] as const;

const toDate = (day: string) => {
	const [year, month, date] = day.split("-").map(Number) as [number, number, number];
	return { day: date, month, year };
};
const fromDate = (value: { day: number; month: number; year: number }) =>
	`${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;

/** What's coming up, what's overdue, and every visit you've had. */
export function CheckupsScreen() {
	const { data, due, today } = useHealthToday();
	const [editing, setEditing] = useState<{ checkup: Checkup | null } | null>(null);
	const done = data.checkups
		.filter((checkup) => checkup.done)
		.sort((a, b) => b.on.localeCompare(a.on));

	const markDone = (checkup: Checkup) =>
		void saveCheckup({ ...checkup, done: true, on: checkup.on > today ? today : checkup.on })
			.then(() => haptics.success())
			.catch((error: unknown) => console.error("[health] could not save the checkup", error));

	return (
		<HealthScreen
			action={{
				icon: "Line/Plus",
				label: "Add a checkup",
				onPress: () => setEditing({ checkup: null }),
			}}
		>
			<ScreenTitle eyebrow="Doctor, dentist, eyes, blood tests" title="Checkups" />
			{data.loading ? (
				<SkeletonList count={2} label="your checkups" />
			) : data.checkups.length === 0 ? (
				<EmptyCard
					icon="Filled/Calendar"
					title="No checkups yet"
					body="Add your last visit or the next one booked. Repeating ones, like the dentist every 6 months, come back on their own."
				>
					<PillButton label="Add a checkup" onPress={() => setEditing({ checkup: null })} />
				</EmptyCard>
			) : (
				<>
					{due.length > 0 ? (
						<Card>
							<CardHead title="Coming up" />
							{due.map((item) => (
								<View key={`${item.checkup.id}-${item.due}`} style={styles.row}>
									<View style={styles.flex}>
										<PoText variant="row15">{item.checkup.title}</PoText>
										<PoText variant="meta13" tone={item.overdue ? "textDanger" : "textSecondary"}>
											{item.overdue
												? `Overdue since ${longDay(item.due)}`
												: `${item.booked ? "Booked" : "Due"} ${longDay(item.due)}`}
										</PoText>
									</View>
									{item.booked ? (
										<SmallButton label="Done" onPress={() => markDone(item.checkup)} />
									) : (
										<SmallButton
											label="Book"
											onPress={() =>
												setEditing({
													checkup: {
														...item.checkup,
														id: newCheckupId(),
														on: item.due < today ? today : item.due,
														done: false,
													},
												})
											}
										/>
									)}
								</View>
							))}
						</Card>
					) : null}
					{done.length > 0 ? (
						<Card>
							<CardHead title="Done" />
							{done.map((checkup) => (
								<CheckupRow
									key={checkup.id}
									checkup={checkup}
									onPress={() => setEditing({ checkup })}
								/>
							))}
						</Card>
					) : null}
				</>
			)}
			<CheckupSheet
				visible={editing !== null}
				checkup={editing?.checkup ?? null}
				today={today}
				onClose={() => setEditing(null)}
			/>
		</HealthScreen>
	);
}

function CheckupRow({ checkup, onPress }: { checkup: Checkup; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.bgHover } : null]}
		>
			<View style={styles.flex}>
				<PoText variant="row15">{checkup.title}</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{[longDay(checkup.on), checkup.note].filter(Boolean).join(" · ")}
				</PoText>
			</View>
			<PoText variant="meta13" tone="textTertiary">
				{CHECKUP_LABELS[checkup.kind]}
			</PoText>
		</Pressable>
	);
}

function CheckupSheet({
	visible,
	checkup,
	today,
	onClose,
}: {
	visible: boolean;
	checkup: Checkup | null;
	today: string;
	onClose: () => void;
}) {
	const [kind, setKind] = useState<CheckupKind>("doctor");
	const [title, setTitle] = useState("");
	const [on, setOn] = useState(today);
	const [repeat, setRepeat] = useState("0");
	const [done, setDone] = useState(false);
	const [note, setNote] = useState("");
	const year = Number(today.slice(0, 4));

	useEffect(() => {
		if (!visible) return;
		setKind(checkup?.kind ?? "doctor");
		setTitle(checkup?.title ?? "");
		setOn(checkup?.on ?? today);
		setRepeat(String(checkup?.repeatMonths ?? 0));
		setDone(checkup?.done ?? false);
		setNote(checkup?.note ?? "");
	}, [visible, checkup, today]);

	const save = async () => {
		try {
			await saveCheckup({
				id: checkup?.id ?? newCheckupId(),
				kind,
				title: title.trim() || CHECKUP_LABELS[kind],
				on,
				done,
				repeatMonths: repeat === "0" ? null : Number(repeat),
				note: note.trim(),
			});
			haptics.success();
			onClose();
		} catch (caught) {
			console.error("[health] could not save the checkup", caught);
		}
	};

	const remove = () => {
		if (!checkup) return;
		showDialog(`Delete ${checkup.title}?`, undefined, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					void removeCheckup(checkup.id).catch((caught: unknown) =>
						console.error("[health] could not delete the checkup", caught),
					);
					onClose();
				},
			},
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={checkup ? "Checkup" : "Add a checkup"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<ChoiceChips
				options={CHECKUP_KINDS.map((value) => ({ value, label: CHECKUP_LABELS[value] }))}
				value={kind}
				onChange={setKind}
			/>
			<TextField
				label="What it is"
				value={title}
				onChangeText={setTitle}
				placeholder={CHECKUP_LABELS[kind]}
			/>
			<DateWheel
				value={toDate(on)}
				onChange={(value) => setOn(fromDate(value))}
				years={[year - 5, year + 3]}
				label="Visit"
			/>
			<ChoiceChips label="Repeats" options={REPEATS} value={repeat} onChange={setRepeat} />
			<View style={styles.toggleRow}>
				<PoText variant="row15" style={styles.flex}>
					Already done
				</PoText>
				<Toggle value={done} onChange={setDone} accessibilityLabel="Already done" />
			</View>
			<TextField
				label="Note (optional)"
				value={note}
				onChangeText={setNote}
				placeholder="Dr Ahmed, all clear"
			/>
			{checkup ? <PillButton label="Delete" variant="danger" onPress={remove} /> : null}
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
	toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
