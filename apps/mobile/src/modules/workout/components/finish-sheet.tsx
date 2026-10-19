import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { logSession } from "../data/training-actions";
import { endLive } from "../hooks/live-actions";
import type { LiveSession } from "../hooks/live-store";
import type { Template } from "../lib/library";
import { type Feel, FEELS } from "../lib/training-model";

/** Ends a live session: how it felt (and how far, for a run), then the summary. */
export function FinishSheet({
	visible,
	live,
	template,
	rounds,
	onClose,
}: {
	visible: boolean;
	live: LiveSession;
	template: Template;
	rounds?: number;
	onClose: () => void;
}) {
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const [feel, setFeel] = useState<Feel | null>("good");
	const [km, setKm] = useState(template.distanceKm ? String(template.distanceKm) : "");
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	/** Blocks a second tap that lands before the disabled button re-renders. */
	const savingRef = useRef(false);
	const running = template.sport === "running";

	const save = () => {
		if (savingRef.current) return;
		const ended = live.pausedAtMs ?? Date.now();
		const durationMin = Math.max(
			1,
			Math.round((ended - live.startedAtMs - live.pausedMs) / 60_000),
		);
		const distance = Number(km.replace(",", "."));
		if (running && !(distance > 0)) {
			setNotice("How far did you run?");
			return;
		}
		savingRef.current = true;
		setSaving(true);
		logSession(
			{
				template: template.id,
				sport: template.sport,
				title: template.title,
				startedAt: new Date(live.startedAtMs).toISOString(),
				durationMin,
				distanceKm: running ? distance : null,
				rounds: rounds ?? null,
				sets: live.sets,
				feel,
			},
			weightKg,
		)
			.then((session) => {
				haptics.success();
				endLive();
				onClose();
				router.replace({ pathname: "/training/session/[id]", params: { id: session.id } });
			})
			.catch((error: unknown) => {
				console.error("[training] could not save the session", error);
				setNotice("Couldn't save on this phone. Try again.");
				savingRef.current = false;
				setSaving(false);
			});
	};

	return (
		<Sheet
			visible={visible}
			title="Finish session"
			onClose={onClose}
			action={{ label: saving ? "Saving…" : "Save", onPress: save, disabled: saving }}
		>
			<View style={styles.body}>
				{running ? (
					<TextField
						label="Distance"
						value={km}
						onChangeText={setKm}
						keyboardType="decimal-pad"
						suffix="km"
					/>
				) : null}
				<PoText variant="meta13" tone="textSecondary">
					How did it feel?
				</PoText>
				<View style={styles.chips}>
					{FEELS.map((item) => (
						<FilterChip
							key={item}
							label={item.charAt(0).toUpperCase() + item.slice(1)}
							selected={feel === item}
							onPress={() => setFeel(item)}
						/>
					))}
				</View>
				{notice ? (
					<PoText variant="meta13" tone="textWarning">
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
