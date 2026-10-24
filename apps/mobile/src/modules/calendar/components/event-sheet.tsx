import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { addDays, dayKey, newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { deleteEvent, saveEvent } from "../data/calendar-actions";
import { type CalendarEvent, clockLabel, type Tone, TONES } from "../lib/calendar-model";

const TONE_LABELS: Record<Tone, string> = {
	accentDefault: "Blue",
	statusSuccess: "Green",
	statusCaution: "Amber",
	statusDanger: "Red",
	statusViolet: "Violet",
};
const LENGTHS = [30, 60, 90, 120, 180] as const;

const at = (day: string) => new Date(`${day}T12:00:00`);
const shift = (day: string, days: number) => dayKey(addDays(at(day), days));
const dateLabel = (day: string) =>
	at(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

function Stepper({
	label,
	value,
	onLess,
	onMore,
}: {
	label: string;
	value: string;
	onLess: () => void;
	onMore: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.stepper}>
			<PoText variant="row15" style={styles.flex}>
				{label}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Earlier ${label}`}
				onPress={onLess}
				style={[styles.round, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Minus" size={16} color={colors.textPrimary} />
			</Pressable>
			<PoText variant="mono13" style={styles.value}>
				{value}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Later ${label}`}
				onPress={onMore}
				style={[styles.round, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textPrimary} />
			</Pressable>
		</View>
	);
}

/**
 * Add or edit a personal event: title, day (or several days), all day or a start time and length,
 * a colour and a note.
 */
export function EventSheet({
	visible,
	event,
	day,
	onClose,
}: {
	visible: boolean;
	/** The event being edited; null to add one on `day`. */
	event: CalendarEvent | null;
	day: string;
	onClose: () => void;
}) {
	const [title, setTitle] = useState("");
	const [date, setDate] = useState(day);
	const [days, setDays] = useState(1);
	const [allDay, setAllDay] = useState(true);
	const [start, setStart] = useState(9 * 60);
	const [length, setLength] = useState(60);
	const [tone, setTone] = useState<Tone>("statusViolet");
	const [note, setNote] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Fresh each time it opens.
	useEffect(() => {
		if (!visible) return;
		setTitle(event?.title ?? "");
		setDate(event?.date ?? day);
		setDays(
			event?.endDate
				? Math.round((at(event.endDate).getTime() - at(event.date).getTime()) / 86_400_000) + 1
				: 1,
		);
		setAllDay(event ? event.start === null : true);
		setStart(event?.start ?? 9 * 60);
		setLength(event?.start !== null && event?.end ? event.end - event.start : 60);
		setTone(event?.tone ?? "statusViolet");
		setNote(event?.note ?? "");
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- resets when the sheet opens
	}, [visible]);

	const save = async () => {
		if (!title.trim()) {
			setNotice("Give it a title.");
			return;
		}
		setSaving(true);
		try {
			await saveEvent({
				id: event?.id ?? newId(),
				title: title.trim(),
				date,
				endDate: days > 1 ? shift(date, days - 1) : null,
				start: allDay ? null : start,
				end: allDay ? null : Math.min(1439, start + length),
				note: note.trim(),
				tone,
				createdAt: event?.createdAt ?? new Date().toISOString(),
			});
			haptics.success();
			onClose();
		} catch (error) {
			console.error("[calendar] could not save the event", error);
			setNotice("Couldn't save on this phone. Try again.");
		} finally {
			setSaving(false);
		}
	};

	const remove = () => {
		if (!event) return;
		Alert.alert(`Delete ${event.title}?`, "This can't be undone.", [
			{ text: "Keep", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					deleteEvent(event.id)
						.then(onClose)
						.catch((error: unknown) => {
							console.error("[calendar] could not delete the event", error);
							setNotice("Couldn't save on this phone. Try again.");
						});
				},
			},
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={event ? "Edit event" : "New event"}
			onClose={onClose}
			footer={
				<View style={styles.footer}>
					{event ? (
						<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
					) : null}
					<PillButton
						label={saving ? "Saving…" : "Save"}
						disabled={saving}
						style={styles.flex}
						onPress={() => void save()}
					/>
				</View>
			}
		>
			<View style={styles.body}>
				<TextField
					label="Title"
					value={title}
					onChangeText={setTitle}
					placeholder="Physio, trip, exam week…"
				/>
				<Stepper
					label="Day"
					value={dateLabel(date)}
					onLess={() => setDate(shift(date, -1))}
					onMore={() => setDate(shift(date, 1))}
				/>
				<View style={styles.wrap}>
					<FilterChip
						label="Today"
						selected={date === dayKey()}
						onPress={() => setDate(dayKey())}
					/>
					<FilterChip
						label="Tomorrow"
						selected={date === shift(dayKey(), 1)}
						onPress={() => setDate(shift(dayKey(), 1))}
					/>
					<FilterChip
						label="In a week"
						selected={date === shift(dayKey(), 7)}
						onPress={() => setDate(shift(dayKey(), 7))}
					/>
				</View>
				<Stepper
					label="Lasts"
					value={days === 1 ? "1 day" : `${days} days`}
					onLess={() => setDays(Math.max(1, days - 1))}
					onMore={() => setDays(Math.min(60, days + 1))}
				/>
				<View style={styles.wrap}>
					<FilterChip label="All day" selected={allDay} onPress={() => setAllDay(!allDay)} />
				</View>
				{!allDay ? (
					<>
						<Stepper
							label="Starts"
							value={clockLabel(start)}
							onLess={() => setStart(Math.max(0, start - 15))}
							onMore={() => setStart(Math.min(1425, start + 15))}
						/>
						<View style={styles.wrap}>
							{LENGTHS.map((minutes) => (
								<FilterChip
									key={minutes}
									label={minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
									selected={length === minutes}
									onPress={() => setLength(minutes)}
								/>
							))}
						</View>
					</>
				) : null}
				<View style={styles.wrap}>
					{TONES.map((item) => (
						<FilterChip
							key={item}
							label={TONE_LABELS[item]}
							selected={tone === item}
							onPress={() => setTone(item)}
						/>
					))}
				</View>
				<TextField label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
				{notice ? (
					<PoText variant="meta13" tone="textDanger">
						{notice}
					</PoText>
				) : null}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	body: { gap: 12, paddingBottom: 8 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
	round: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	value: { minWidth: 110, textAlign: "center" },
	footer: { flexDirection: "row", gap: 10 },
});
