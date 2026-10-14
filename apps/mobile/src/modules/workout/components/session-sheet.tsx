import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { estimateKcal } from "../lib/kcal";
import { activeElapsedMs, type Feel, typeLabel, type WorkoutType } from "../lib/types";
import {
	addSession,
	clearTimer,
	startTimer,
	stopTimer,
	togglePause,
	useWorkoutStore,
} from "../store/workout-store";
import { DISTANCE_TYPES, feelOptions, readNumber, typeOptions } from "./fields";

export type SessionSheetProps = { visible: boolean; onClose: () => void };

function formatTimer(ms: number): string {
	const total = Math.floor(ms / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const mm = String(minutes).padStart(2, "0");
	const ss = String(seconds).padStart(2, "0");
	return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Start workout: pick a type, run the live timer, then review and save the session. */
export function SessionSheet({ visible, onClose }: SessionSheetProps) {
	const active = useWorkoutStore((state) => state.data.active);
	const [review, setReview] = useState<number | null>(null);

	useEffect(() => {
		if (!active) setReview(null);
	}, [active]);

	if (active && review !== null) {
		return (
			<ReviewStep
				visible={visible}
				onClose={onClose}
				type={active.type}
				title={active.title}
				startedAtMs={active.startedAtMs}
				minutes={review}
				onBack={() => {
					togglePause();
					setReview(null);
				}}
			/>
		);
	}
	if (active) {
		return (
			<TimerStep visible={visible} onClose={onClose} onFinish={() => setReview(stopTimer())} />
		);
	}
	return <SetupStep visible={visible} onClose={onClose} />;
}

function SetupStep({ visible, onClose }: SessionSheetProps) {
	const [type, setType] = useState<WorkoutType>("strength");
	const [title, setTitle] = useState("");
	return (
		<Sheet
			visible={visible}
			title="Start workout"
			onClose={onClose}
			action={{
				label: "Start",
				onPress: () => {
					haptics.success();
					startTimer(type, title.trim() || typeLabel[type]);
					setTitle("");
				},
			}}
		>
			<ChoiceChips label="Type" options={typeOptions} value={type} onChange={setType} />
			<TextField label="Name" value={title} onChangeText={setTitle} placeholder={typeLabel[type]} />
		</Sheet>
	);
}

function confirmDiscard(): void {
	Alert.alert("Discard workout?", "The timer stops and nothing is saved.", [
		{ text: "Keep going", style: "cancel" },
		{ text: "Discard", style: "destructive", onPress: clearTimer },
	]);
}

type TimerStepProps = SessionSheetProps & { onFinish: () => void };

function TimerStep({ visible, onClose, onFinish }: TimerStepProps) {
	const active = useWorkoutStore((state) => state.data.active);
	const [now, setNow] = useState(() => Date.now());
	const paused = active?.pausedAtMs !== null;

	useEffect(() => {
		if (!visible || paused) return;
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [visible, paused]);

	if (!active) return null;

	return (
		<Sheet
			visible={visible}
			title={active.title}
			onClose={onClose}
			action={{
				label: "Finish",
				onPress: () => {
					haptics.tap();
					onFinish();
				},
			}}
		>
			<View style={styles.clock} accessibilityLiveRegion="polite">
				<PoText variant="eyebrow11" tone={paused ? "textWarning" : "textTertiary"}>
					{paused ? "Paused" : typeLabel[active.type]}
				</PoText>
				<PoText variant="hero40" style={styles.digits}>
					{formatTimer(activeElapsedMs(active, now))}
				</PoText>
			</View>
			<PillButton
				variant="secondary"
				label={paused ? "Resume" : "Pause"}
				onPress={() => {
					haptics.select();
					togglePause();
				}}
			/>
			<PillButton variant="ghost" label="Discard" onPress={confirmDiscard} />
		</Sheet>
	);
}

type ReviewStepProps = SessionSheetProps & {
	type: WorkoutType;
	title: string;
	startedAtMs: number;
	minutes: number;
	onBack: () => void;
};

function ReviewStep({
	visible,
	onClose,
	type,
	title,
	startedAtMs,
	minutes,
	onBack,
}: ReviewStepProps) {
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const [minutesText, setMinutesText] = useState(String(minutes));
	const [distanceText, setDistanceText] = useState("");
	const [kcalText, setKcalText] = useState("");
	const [feel, setFeel] = useState<Feel | null>(null);

	const duration = readNumber(minutesText);
	const distance = readNumber(distanceText) ?? undefined;
	const estimate = duration ? estimateKcal(type, duration, weightKg, distance) : 0;

	const save = () => {
		if (!duration) return;
		addSession({
			type,
			title,
			startedAt: new Date(startedAtMs).toISOString(),
			durationMin: Math.round(duration),
			...(distance ? { distanceKm: distance } : {}),
			kcal: Math.round(readNumber(kcalText) ?? estimate),
			feel,
		});
		clearTimer();
		haptics.success();
		onClose();
	};

	return (
		<Sheet
			visible={visible}
			title="Save workout"
			onClose={onClose}
			action={{ label: "Save workout", onPress: save, disabled: !duration }}
		>
			<TextField
				label="Minutes"
				value={minutesText}
				onChangeText={setMinutesText}
				keyboardType="number-pad"
				suffix="min"
			/>
			{DISTANCE_TYPES.includes(type) ? (
				<TextField
					label="Distance (optional)"
					value={distanceText}
					onChangeText={setDistanceText}
					keyboardType="decimal-pad"
					suffix="km"
				/>
			) : null}
			<TextField
				label="Calories"
				value={kcalText}
				onChangeText={setKcalText}
				keyboardType="number-pad"
				placeholder={`${estimate} (estimate)`}
				suffix="kcal"
			/>
			<ChoiceChips label="How did it feel?" options={feelOptions} value={feel} onChange={setFeel} />
			<PillButton variant="ghost" label="Back to timer" onPress={onBack} />
		</Sheet>
	);
}

const styles = StyleSheet.create({
	clock: { alignItems: "center", gap: 6, paddingVertical: 12 },
	digits: { fontVariant: ["tabular-nums"] },
});
