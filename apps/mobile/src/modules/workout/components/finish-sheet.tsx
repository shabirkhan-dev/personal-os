import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { voiceOut } from "@/lib/voice";
import { applyProgress, logSession } from "../data/training-actions";
import { endLive } from "../hooks/live-actions";
import type { LiveSession } from "../hooks/live-store";
import { exerciseById } from "../lib/exercise-guide";
import type { Template } from "../lib/library";
import { CHAINS, type ChainId, type Progress } from "../lib/programs/program-model";
import { type Feel, FEELS } from "../lib/training-model";

/** Ends a live session: how it felt (and how far, for a run), then the summary. */
export function FinishSheet({
	visible,
	live,
	template,
	rounds,
	progress,
	onClose,
}: {
	visible: boolean;
	live: LiveSession;
	template: Template;
	rounds?: number;
	/** Levels before this session, for program sessions. */
	progress?: ReadonlyMap<string, Progress>;
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
			.then(async (session) => {
				haptics.success();
				await levelUp(template, live, feel, progress);
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

/** Moves program levels on and says when a new variation starts next time. */
async function levelUp(
	template: Template,
	live: LiveSession,
	feel: Feel | null,
	saved: ReadonlyMap<string, Progress> | undefined,
): Promise<void> {
	if (!template.program || !saved) return;
	try {
		const updates = await applyProgress(template, live.sets, feel, saved);
		const trained = new Map(
			template.exercises.flatMap((exercise) =>
				exercise.progress ? [[exercise.progress.key, exercise.progress.step] as const] : [],
			),
		);
		const promoted = updates.filter((item) => item.step > (trained.get(item.id) ?? item.step));
		const names = promoted
			.map((item) => {
				const rungs = CHAINS[item.id as ChainId];
				return rungs ? exerciseById(String(rungs[item.step]))?.name : undefined;
			})
			.filter((name): name is string => Boolean(name));
		if (names.length > 0) {
			voiceOut.speak(`Level up. Next time: ${names.join(" and ")}.`);
		}
	} catch (error) {
		// The session is saved either way; the levels catch up next time.
		console.error("[training] could not move program levels", error);
	}
}
