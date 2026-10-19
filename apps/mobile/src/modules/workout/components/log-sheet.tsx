import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { logSession } from "../data/training-actions";
import { type Feel, FEELS, type Session, SPORT_LABELS, type Sport } from "../lib/training-model";

const SPORTS: readonly Sport[] = [
	"calisthenics",
	"running",
	"boxing",
	"yoga",
	"walk",
	"football",
	"volleyball",
	"gym",
	"cycle",
	"swimming",
];

/** Log a session by hand: what, how long, how far, how it felt. */
export function LogSheet({
	visible,
	weightKg,
	onClose,
	onLogged,
}: {
	visible: boolean;
	weightKg: number;
	onClose: () => void;
	onLogged: (session: Session) => void;
}) {
	const [sport, setSport] = useState<Sport>("calisthenics");
	const [minutes, setMinutes] = useState("45");
	const [km, setKm] = useState("");
	const [feel, setFeel] = useState<Feel | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	/** Blocks a second tap that lands before the disabled button re-renders. */
	const savingRef = useRef(false);
	const distance =
		sport === "running" || sport === "walk" || sport === "cycle" || sport === "swimming";

	const save = () => {
		if (savingRef.current) return;
		const duration = Number(minutes);
		if (!Number.isFinite(duration) || duration <= 0) {
			setNotice("How many minutes?");
			return;
		}
		const distanceKm =
			distance && Number(km.replace(",", ".")) > 0 ? Number(km.replace(",", ".")) : null;
		savingRef.current = true;
		setSaving(true);
		logSession(
			{
				template: null,
				sport,
				title: sport === "running" && distanceKm ? `Run · ${distanceKm} km` : SPORT_LABELS[sport],
				startedAt: new Date(Date.now() - duration * 60_000).toISOString(),
				durationMin: Math.round(duration),
				distanceKm,
				rounds: null,
				sets: [],
				feel,
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
			title="Log a session"
			onClose={onClose}
			action={{ label: saving ? "Saving…" : "Log", onPress: save, disabled: saving }}
		>
			<View style={styles.body}>
				<View style={styles.chips}>
					{SPORTS.map((item) => (
						<FilterChip
							key={item}
							label={SPORT_LABELS[item]}
							selected={sport === item}
							onPress={() => setSport(item)}
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
						onSubmitEditing={save}
					/>
				) : null}
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
