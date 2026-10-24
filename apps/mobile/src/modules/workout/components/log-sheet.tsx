import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { logSession } from "../data/training-actions";
import type { Activity } from "../lib/activities";
import { type Feel, FEELS, type Session, SPORT_LABELS, type Sport } from "../lib/training-model";

/** Without activities of their own, these still let someone log a session. */
const GENERIC: readonly Sport[] = ["calisthenics", "running", "boxing", "yoga", "walk", "other"];
const DISTANCE_KINDS: ReadonlySet<Sport> = new Set(["running", "walk", "cycle", "swimming"]);

type Choice = { kind: "activity"; activity: Activity } | { kind: "sport"; sport: Sport };

const number = (text: string) => {
	const value = Number(text.replace(",", "."));
	return Number.isFinite(value) && text.trim() !== "" ? value : null;
};

/**
 * Log a session by hand: one of their activities (with its own numbers: goals, laps, points) or a
 * generic session, how long, how far, how it felt.
 */
export function LogSheet({
	visible,
	weightKg,
	activities,
	initialActivity,
	onClose,
	onLogged,
}: {
	visible: boolean;
	weightKg: number;
	activities: readonly Activity[];
	/** Opens on this activity ("Log football" from today's plan). */
	initialActivity?: string | null;
	onClose: () => void;
	onLogged: (session: Session) => void;
}) {
	const [choice, setChoice] = useState<Choice>({ kind: "sport", sport: "calisthenics" });
	const [minutes, setMinutes] = useState("45");
	const [km, setKm] = useState("");
	const [values, setValues] = useState<Record<string, string>>({});
	const [feel, setFeel] = useState<Feel | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	/** Blocks a second tap that lands before the disabled button re-renders. */
	const savingRef = useRef(false);

	const pick = (next: Choice) => {
		setChoice(next);
		setValues({});
		if (next.kind === "activity") setMinutes(String(next.activity.minutes));
	};

	// Each opening starts on the activity asked for, or their first one.
	useEffect(() => {
		if (!visible) return;
		const start =
			activities.find((activity) => activity.id === initialActivity) ?? activities[0] ?? null;
		pick(start ? { kind: "activity", activity: start } : { kind: "sport", sport: "calisthenics" });
		setKm("");
		setFeel(null);
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- resets when the sheet opens
	}, [visible]);

	const activity = choice.kind === "activity" ? choice.activity : null;
	const sport = activity?.kind ?? (choice.kind === "sport" ? choice.sport : "other");
	const distance = activity ? activity.distance : DISTANCE_KINDS.has(sport);

	const save = () => {
		if (savingRef.current) return;
		const duration = number(minutes);
		if (duration === null || duration <= 0) {
			setNotice("How many minutes?");
			return;
		}
		const distanceKm = distance && (number(km) ?? 0) > 0 ? number(km) : null;
		const metrics: Record<string, number> = {};
		for (const metric of activity?.metrics ?? []) {
			const value = number(values[metric.key] ?? "");
			if (value !== null) metrics[metric.key] = value;
		}
		const title =
			activity?.name ??
			(sport === "running" && distanceKm ? `Run · ${distanceKm} km` : SPORT_LABELS[sport]);
		savingRef.current = true;
		setSaving(true);
		logSession(
			{
				template: null,
				sport,
				title,
				startedAt: new Date(Date.now() - duration * 60_000).toISOString(),
				durationMin: Math.round(duration),
				distanceKm,
				rounds: null,
				sets: [],
				feel,
				...(activity ? { activity: activity.id } : {}),
				...(Object.keys(metrics).length > 0 ? { metrics } : {}),
			},
			weightKg,
		)
			.then((session) => {
				haptics.success();
				onLogged(session);
				onClose();
			})
			.catch((error: unknown) => {
				console.error("[training] could not log", error);
				setNotice("Couldn't save on this phone. Try again.");
			})
			.finally(() => {
				savingRef.current = false;
				setSaving(false);
			});
	};

	return (
		<Sheet
			visible={visible}
			title={activity ? `Log ${activity.name}` : "Log a session"}
			onClose={onClose}
			action={{ label: saving ? "Saving…" : "Log", onPress: save, disabled: saving }}
		>
			<View style={styles.body}>
				<View style={styles.chips}>
					{activities.map((item) => (
						<FilterChip
							key={item.id}
							label={item.name}
							selected={activity?.id === item.id}
							onPress={() => pick({ kind: "activity", activity: item })}
						/>
					))}
					{GENERIC.map((item) => (
						<FilterChip
							key={item}
							label={SPORT_LABELS[item]}
							selected={choice.kind === "sport" && choice.sport === item}
							onPress={() => pick({ kind: "sport", sport: item })}
						/>
					))}
				</View>
				<TextField
					label="Minutes"
					value={minutes}
					onChangeText={setMinutes}
					keyboardType="number-pad"
					suffix="min"
				/>
				{distance ? (
					<TextField
						label="Distance"
						value={km}
						onChangeText={setKm}
						keyboardType="decimal-pad"
						suffix="km"
					/>
				) : null}
				{activity?.metrics.map((metric) => (
					<TextField
						key={metric.key}
						label={metric.label}
						value={values[metric.key] ?? ""}
						onChangeText={(text) => setValues((current) => ({ ...current, [metric.key]: text }))}
						keyboardType="decimal-pad"
						suffix={metric.unit || undefined}
					/>
				))}
				<View style={styles.chips}>
					{FEELS.map((item) => (
						<FilterChip
							key={item}
							label={item.charAt(0).toUpperCase() + item.slice(1)}
							selected={feel === item}
							onPress={() => setFeel(feel === item ? null : item)}
						/>
					))}
				</View>
				{notice ? (
					<PoText variant="meta13" tone="textSecondary">
						{notice}
					</PoText>
				) : null}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	body: { gap: 12 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
