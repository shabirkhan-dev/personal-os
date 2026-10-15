import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Footer, ListCard, ListRow, SectionLabel } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { PrayerRow } from "../lib/faith-math";
import type { FaithSettings, PrayerStatus } from "../lib/faith-model";
import {
	hhmm,
	METHOD_LABELS,
	METHODS,
	type MethodId,
	PRAYER_LABELS,
	PRAYERS,
	type PrayerId,
	parseClock,
} from "../lib/prayer-times";

// --- log a prayer -----------------------------------------------------------------------------

const STATUS_OPTIONS: readonly { value: PrayerStatus; label: string }[] = [
	{ value: "prayed", label: "On time" },
	{ value: "late", label: "Late" },
	{ value: "missed", label: "Missed" },
];

/** "Log a prayer": which one, and whether it was on time. */
export function LogPrayerSheet({
	visible,
	rows,
	now,
	initial,
	onClose,
	onSave,
}: {
	visible: boolean;
	rows: readonly PrayerRow[];
	now: Date;
	initial: PrayerId | null;
	onClose: () => void;
	onSave: (prayer: PrayerId, status: PrayerStatus) => void;
}) {
	const firstOpen = rows.findLast((row) => row.state === "due") ?? rows[0];
	const [prayer, setPrayer] = useState<PrayerId | null>(initial ?? firstOpen?.prayer ?? null);
	const row = rows.find((item) => item.prayer === prayer);
	const suggested: PrayerStatus =
		row && row.at <= now && now.getTime() - row.at.getTime() > 60 * 60_000 ? "late" : "prayed";
	const [status, setStatus] = useState<PrayerStatus | null>(null);
	const chosen = status ?? suggested;

	return (
		<Sheet
			visible={visible}
			title="Log a prayer"
			onClose={onClose}
			action={{
				label: chosen === "missed" ? "Save as missed" : "Save",
				disabled: !prayer,
				onPress: () => prayer && onSave(prayer, chosen),
			}}
		>
			<ChoiceChips
				label="Prayer"
				options={rows.map((item) => ({
					value: item.prayer,
					label: `${item.label} · ${hhmm(item.at)}`,
				}))}
				value={prayer}
				onChange={(value) => {
					setPrayer(value);
					setStatus(null);
				}}
			/>
			<ChoiceChips
				label="How did it go?"
				options={STATUS_OPTIONS}
				value={chosen}
				onChange={setStatus}
			/>
			{chosen === "missed" ? (
				<PoText variant="meta13" tone="textSecondary">
					That's okay. Logging it honestly is how the next one gets easier.
				</PoText>
			) : null}
		</Sheet>
	);
}

// --- reminders --------------------------------------------------------------------------------

/** "Prayer reminders": a toggle per prayer, quiet while praying, and where the times come from. */
export function RemindersSheet({
	visible,
	settings,
	rows,
	onClose,
	onChange,
	locating,
	locateError,
	onChangeLocation,
	onEditTimes,
}: {
	visible: boolean;
	settings: FaithSettings;
	rows: readonly PrayerRow[];
	onClose: () => void;
	onChange: (settings: FaithSettings) => void;
	/** "Finding where you are…" while locating. */
	locating: string | null;
	locateError: string | null;
	onChangeLocation: () => void;
	onEditTimes: () => void;
}) {
	const { colors } = usePoTheme();
	const source = settings.place
		? `Times for ${settings.place.name} · updated daily`
		: "Times you set yourself";
	return (
		<Sheet
			visible={visible}
			title="Prayer reminders"
			onClose={onClose}
			footer={
				<Footer>
					<PillButton
						label={locating ?? (settings.place ? "Change location" : "Use my location")}
						variant="secondary"
						disabled={locating !== null}
						onPress={onChangeLocation}
						style={styles.flex}
					/>
					<PillButton label="Done" onPress={onClose} style={styles.flex} />
				</Footer>
			}
		>
			<View style={styles.source}>
				<View style={[styles.liveDot, { backgroundColor: colors.statusSuccess }]} />
				<PoText variant="eyebrow11" tone="textTertiary">
					{source}
				</PoText>
			</View>
			<LocateStatus locating={locating} error={locateError} />
			<ListCard>
				{rows.map((row, index) => (
					<ToggleRow
						key={row.prayer}
						title={`${row.label} · ${hhmm(row.at)}`}
						subtitle={`${settings.reminderLead} min before`}
						value={settings.reminders[row.prayer] !== false}
						last={index === rows.length - 1}
						onChange={(on) =>
							onChange({ ...settings, reminders: { ...settings.reminders, [row.prayer]: on } })
						}
					/>
				))}
			</ListCard>
			<ChoiceChips
				label="Remind me"
				options={[0, 5, 10, 15, 30].map((minutes) => ({
					value: String(minutes),
					label: minutes === 0 ? "At the time" : `${minutes} min before`,
				}))}
				value={String(settings.reminderLead)}
				onChange={(value) => onChange({ ...settings, reminderLead: Number(value) })}
			/>
			<SectionLabel>While you pray</SectionLabel>
			<ToggleRow
				title="Silence notifications"
				subtitle="This app's alerts stay quiet for 15 minutes from each prayer time"
				value={settings.silence}
				last
				onChange={(silence) => onChange({ ...settings, silence })}
			/>
			<ListRow
				title="Prayers, times and method"
				subtitle="Add Dhuhr and Asr, or type your times"
				chevron
				last
				onPress={onEditTimes}
			/>
		</Sheet>
	);
}

function ToggleRow({
	title,
	subtitle,
	value,
	last,
	onChange,
}: {
	title: string;
	subtitle: string;
	value: boolean;
	last: boolean;
	onChange: (value: boolean) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.toggleRow,
				last ? null : { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
			]}
		>
			<View style={styles.flex}>
				<PoText variant="row15">{title}</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{subtitle}
				</PoText>
			</View>
			<Toggle value={value} onChange={onChange} accessibilityLabel={title} />
		</View>
	);
}

// --- prayers and times ------------------------------------------------------------------------

/** Which prayers, how the times are worked out, typed times and the person's tradition. */
export function PrayerSetupSheet({
	visible,
	settings,
	locating,
	locateError,
	onClose,
	onLocate,
	onSave,
}: {
	visible: boolean;
	settings: FaithSettings;
	/** "Finding where you are…" while locating. */
	locating: string | null;
	locateError: string | null;
	onClose: () => void;
	onLocate: () => void;
	onSave: (settings: FaithSettings) => void;
}) {
	const { colors } = usePoTheme();
	const [prayers, setPrayers] = useState<PrayerId[]>(settings.prayers);
	const [method, setMethod] = useState<MethodId>(settings.method);
	const [hanafi, setHanafi] = useState(settings.asr === "hanafi");
	const [tradition, setTradition] = useState(settings.tradition);
	const [times, setTimes] = useState<Partial<Record<PrayerId, string>>>(() => {
		const out: Partial<Record<PrayerId, string>> = {};
		for (const id of PRAYERS) {
			const minute = settings.manual[id];
			if (minute !== undefined) {
				out[id] =
					`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
			}
		}
		return out;
	});

	const manual: Partial<Record<PrayerId, number>> = {};
	const invalid: PrayerId[] = [];
	for (const id of prayers) {
		const text = times[id]?.trim();
		if (!text) continue;
		const minute = parseClock(text);
		if (minute === null) invalid.push(id);
		else manual[id] = minute;
	}
	const missing = settings.place ? [] : prayers.filter((id) => manual[id] === undefined);
	const canSave = prayers.length > 0 && invalid.length === 0 && missing.length === 0;

	const toggle = (id: PrayerId) => {
		haptics.select();
		setPrayers((current) =>
			current.includes(id)
				? current.filter((item) => item !== id)
				: PRAYERS.filter((item) => item === id || current.includes(item)),
		);
	};

	return (
		<Sheet
			visible={visible}
			title="Prayers and times"
			onClose={onClose}
			action={{
				label: "Save",
				disabled: !canSave,
				onPress: () =>
					onSave({
						...settings,
						setUp: true,
						prayers,
						method,
						asr: hanafi ? "hanafi" : "standard",
						manual,
						tradition: tradition.trim(),
					}),
			}}
		>
			<SectionLabel>Your prayers</SectionLabel>
			<View style={styles.prayerChips}>
				{PRAYERS.map((id) => {
					const on = prayers.includes(id);
					return (
						<Pressable
							key={id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: on }}
							onPress={() => toggle(id)}
							style={[
								styles.prayerChip,
								on
									? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
									: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
							]}
						>
							<PoText variant="meta13" tone={on ? "textOnAccent" : "textSecondary"}>
								{PRAYER_LABELS[id]}
							</PoText>
						</Pressable>
					);
				})}
			</View>

			<SectionLabel>
				{settings.place ? `Worked out for ${settings.place.name}` : "From your location"}
			</SectionLabel>
			<PillButton
				label={locating ?? (settings.place ? "Update my location" : "Use my location")}
				variant="secondary"
				disabled={locating !== null}
				onPress={onLocate}
			/>
			<LocateStatus locating={locating} error={locateError} />
			<ChoiceChips
				label="Method"
				options={METHODS.map((id) => ({ value: id, label: METHOD_LABELS[id] }))}
				value={method}
				onChange={setMethod}
			/>
			{prayers.includes("asr") ? (
				<ToggleRow
					title="Later Asr (Hanafi)"
					subtitle="When shadows are twice their length"
					value={hanafi}
					last
					onChange={setHanafi}
				/>
			) : null}

			<SectionLabel>
				{settings.place ? "Or type a time to use instead" : "Type your times"}
			</SectionLabel>
			{prayers.map((id) => (
				<TextField
					key={id}
					label={PRAYER_LABELS[id]}
					value={times[id] ?? ""}
					placeholder={settings.place ? "Calculated" : "e.g. 04:58"}
					keyboardType="numbers-and-punctuation"
					onChangeText={(value) => setTimes((current) => ({ ...current, [id]: value }))}
				/>
			))}
			{invalid.length > 0 || missing.length > 0 ? (
				<PoText variant="meta13" tone="textDanger">
					{invalid.length > 0
						? `Check the time for ${invalid.map((id) => PRAYER_LABELS[id]).join(", ")} (like 17:38).`
						: `Add a time for ${missing.map((id) => PRAYER_LABELS[id]).join(", ")}, or use your location.`}
				</PoText>
			) : null}

			<TextField
				label="Your tradition (optional)"
				value={tradition}
				placeholder="e.g. Shia Ismaili, Hanafi"
				onChangeText={setTradition}
			/>
			<PoText variant="meta13" tone="textTertiary">
				Answers to your questions follow it.
			</PoText>
		</Sheet>
	);
}

/** A spinner with the current step while locating, or the reason it failed. */
export function LocateStatus({
	locating,
	error,
}: {
	locating: string | null;
	error: string | null;
}) {
	const { colors } = usePoTheme();
	if (locating) {
		return (
			<View style={styles.status} accessibilityLiveRegion="polite">
				<ActivityIndicator size="small" color={colors.accentDefault} />
				<PoText variant="meta13" tone="textSecondary">
					{locating}
				</PoText>
			</View>
		);
	}
	return error ? (
		<PoText variant="meta13" tone="textDanger" accessibilityLiveRegion="polite">
			{error}
		</PoText>
	) : null;
}

const styles = StyleSheet.create({
	status: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6 },
	flex: { flex: 1 },
	source: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6 },
	liveDot: { width: 8, height: 8, borderRadius: 4 },
	toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
	prayerChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	prayerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
});
