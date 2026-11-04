import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyCard, FilterChip, ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { photoSource } from "@/lib/photos/local-photo";
import { DateWheel } from "@/modules/onboarding/components/date-wheel";
import { usePoTheme } from "@/theme";
import { newRecordId, removeRecord, saveRecord } from "../data/health-actions";
import { useHealth } from "../hooks/use-health";
import {
	type HealthRecord,
	RECORD_KINDS,
	RECORD_LABELS,
	type RecordKind,
} from "../lib/health-model";
import { forgetHealthPhoto } from "../services/health-photo";
import { longDay, SmallButton } from "./health-cards";
import { HealthScreen } from "./health-screen";
import { PhotoField, PhotoThumb } from "./photo-field";

const toDate = (day: string) => {
	const [year, month, date] = day.split("-").map(Number) as [number, number, number];
	return { day: date, month, year };
};
const fromDate = (value: { day: number; month: number; year: number }) =>
	`${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;

/** Photos of the papers that matter, so they're on your phone when a doctor asks. */
export function RecordsScreen() {
	const data = useHealth();
	const [filter, setFilter] = useState<RecordKind | "all">("all");
	const [editing, setEditing] = useState<{ record: HealthRecord | null } | null>(null);
	const [viewing, setViewing] = useState<string | null>(null);
	const kinds = RECORD_KINDS.filter((kind) => data.records.some((record) => record.kind === kind));
	const shown = data.records.filter((record) => filter === "all" || record.kind === filter);

	return (
		<HealthScreen
			action={{
				icon: "Line/Plus",
				label: "Add a record",
				onPress: () => setEditing({ record: null }),
			}}
		>
			<ScreenTitle eyebrow="Prescriptions, reports, scans" title="Records" />
			{data.loading ? (
				<SkeletonList count={2} label="your records" />
			) : data.records.length === 0 ? (
				<EmptyCard
					icon="Filled/Camera"
					title="No records yet"
					body="Take a photo of a prescription, a lab report or your vaccine card. It stays on your phone and in your backup."
				>
					<PillButton label="Add a record" onPress={() => setEditing({ record: null })} />
				</EmptyCard>
			) : (
				<>
					{kinds.length > 1 ? (
						<View style={styles.chips}>
							<FilterChip
								label="All"
								selected={filter === "all"}
								onPress={() => setFilter("all")}
							/>
							{kinds.map((kind) => (
								<FilterChip
									key={kind}
									label={RECORD_LABELS[kind]}
									selected={filter === kind}
									onPress={() => setFilter(kind)}
								/>
							))}
						</View>
					) : null}
					<View style={styles.grid}>
						{shown.map((record) => (
							<RecordTile
								key={record.id}
								record={record}
								onPress={() => (record.photo ? setViewing(record.photo) : setEditing({ record }))}
								onLongPress={() => setEditing({ record })}
							/>
						))}
					</View>
					<PoText variant="meta13" tone="textTertiary" style={styles.hint}>
						Tap to view. Press and hold to edit.
					</PoText>
				</>
			)}
			<RecordSheet
				visible={editing !== null}
				record={editing?.record ?? null}
				onClose={() => setEditing(null)}
			/>
			<PhotoViewer uri={viewing} onClose={() => setViewing(null)} />
		</HealthScreen>
	);
}

function RecordTile({
	record,
	onPress,
	onLongPress,
}: {
	record: HealthRecord;
	onPress: () => void;
	onLongPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${record.title}, ${longDay(record.on)}`}
			accessibilityHint="Press and hold to edit"
			onPress={onPress}
			onLongPress={onLongPress}
			style={({ pressed }) => [
				styles.tile,
				{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
			]}
		>
			<View style={styles.thumb}>
				<PhotoThumb uri={record.photo} size={140} icon="List" tall />
			</View>
			<PoText variant="row15" numberOfLines={1}>
				{record.title}
			</PoText>
			<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
				{`${RECORD_LABELS[record.kind]} · ${longDay(record.on)}`}
			</PoText>
		</Pressable>
	);
}

function PhotoViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
	const insets = useSafeAreaInsets();
	const { colors } = usePoTheme();
	return (
		<Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose}>
			<View style={[styles.viewer, { backgroundColor: colors.bgCanvas }]}>
				{uri ? (
					<Image
						source={{ uri: photoSource(uri) }}
						resizeMode="contain"
						style={styles.full}
						accessibilityIgnoresInvertColors
					/>
				) : null}
				<View style={[styles.close, { top: insets.top + 12 }]}>
					<SmallButton label="Close" onPress={onClose} />
				</View>
			</View>
		</Modal>
	);
}

function RecordSheet({
	visible,
	record,
	onClose,
}: {
	visible: boolean;
	record: HealthRecord | null;
	onClose: () => void;
}) {
	const today = dayKey();
	const year = Number(today.slice(0, 4));
	const [kind, setKind] = useState<RecordKind>("prescription");
	const [title, setTitle] = useState("");
	const [on, setOn] = useState(today);
	const [photo, setPhoto] = useState<string | null>(null);
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setKind(record?.kind ?? "prescription");
		setTitle(record?.title ?? "");
		setOn(record?.on ?? today);
		setPhoto(record?.photo ?? null);
		setNote(record?.note ?? "");
		setError(null);
	}, [visible, record, today]);

	const save = async () => {
		if (!photo && !title.trim()) {
			setError("Add a photo or a title.");
			return;
		}
		try {
			await saveRecord({
				id: record?.id ?? newRecordId(),
				kind,
				title: title.trim() || RECORD_LABELS[kind],
				on,
				photo,
				note: note.trim(),
			});
			if (record?.photo && record.photo !== photo) forgetHealthPhoto(record.photo);
			haptics.success();
			onClose();
		} catch (caught) {
			console.error("[health] could not save the record", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	const remove = () => {
		if (!record) return;
		showDialog(`Delete ${record.title}?`, "The photo goes too.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					void removeRecord(record.id)
						.then(() => forgetHealthPhoto(record.photo))
						.catch((caught: unknown) =>
							console.error("[health] could not delete the record", caught),
						);
					onClose();
				},
			},
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={record ? record.title : "Add a record"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<PhotoField value={photo} onChange={setPhoto} shape="paper" icon="List" />
			<ChoiceChips
				options={RECORD_KINDS.map((value) => ({ value, label: RECORD_LABELS[value] }))}
				value={kind}
				onChange={setKind}
			/>
			<TextField
				label="Title"
				value={title}
				onChangeText={setTitle}
				placeholder={kind === "report" ? "Blood test, City Lab" : RECORD_LABELS[kind]}
			/>
			<DateWheel
				value={toDate(on)}
				onChange={(value) => setOn(fromDate(value))}
				years={[year - 20, year]}
				label="Date on it"
			/>
			<TextField
				label="Note (optional)"
				value={note}
				onChangeText={setNote}
				placeholder="Dr Ahmed, for the cough"
			/>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			{record ? <PillButton label="Delete" variant="danger" onPress={remove} /> : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tile: { flexBasis: "48%", flexGrow: 1, maxWidth: "50%", gap: 4, padding: 8, borderRadius: 16 },
	thumb: { alignItems: "stretch", marginBottom: 4 },
	hint: { textAlign: "center" },
	viewer: { flex: 1, justifyContent: "center" },
	full: { flex: 1 },
	close: { position: "absolute", right: 16 },
});
