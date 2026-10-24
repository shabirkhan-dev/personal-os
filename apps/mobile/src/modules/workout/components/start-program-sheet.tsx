import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { startProgram } from "../data/training-actions";
import { type Activity, presetForKind } from "../lib/activities";
import { EQUIPMENT, EQUIPMENT_LABELS, type Equipment, exerciseById } from "../lib/exercise-guide";
import { chainsIn, defaultStep } from "../lib/programs/engine";
import {
	CHAIN_LABELS,
	CHAINS,
	type ChainId,
	type FixedDay,
	type ProgramDef,
	type Progress,
} from "../lib/programs/program-model";
import {
	SESSION_LENGTHS,
	type Sport,
	type TrainingSettings,
	type WeekPlan,
} from "../lib/training-model";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function Label({ title, hint }: { title: string; hint?: string }) {
	return (
		<View style={styles.label}>
			<PoText variant="row15">{title}</PoText>
			{hint ? (
				<PoText variant="meta13" tone="textSecondary">
					{hint}
				</PoText>
			) : null}
		</View>
	);
}

/**
 * Starting (or switching to) a program: days a week, session length, equipment, team days and
 * where you are now on each exercise ladder, so the first week fits.
 */
export function StartProgramSheet({
	program,
	settings,
	progress,
	plan,
	activities,
	switchingFrom,
	visible,
	onClose,
	onStarted,
}: {
	program: ProgramDef;
	settings: TrainingSettings;
	progress: ReadonlyMap<string, Progress>;
	/** This week's plan, so days already gone keep what they had. */
	plan: WeekPlan | null;
	/** The person's activities, for fixed days. */
	activities: readonly Activity[];
	switchingFrom: string | null;
	visible: boolean;
	onClose: () => void;
	onStarted: () => void;
}) {
	const dayOptions = Object.keys(program.schedule)
		.map(Number)
		.sort((a, b) => a - b);
	const fallbackDays = dayOptions.includes(settings.daysPerWeek)
		? settings.daysPerWeek
		: (dayOptions.at(-1) ?? settings.daysPerWeek);
	const chains = chainsIn(program);
	const [days, setDays] = useState(fallbackDays);
	const [minutes, setMinutes] = useState(settings.minutes);
	const [equipment, setEquipment] = useState<Equipment[]>(settings.equipment);
	const [fixed, setFixed] = useState<FixedDay[]>(settings.fixedDays);
	const [steps, setSteps] = useState<Partial<Record<ChainId, number>>>({});
	const [saving, setSaving] = useState(false);
	/** The weekday whose activity is being picked. */
	const [editingDay, setEditingDay] = useState<number | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	// Fresh choices each time the sheet opens.
	useEffect(() => {
		if (!visible) return;
		setDays(fallbackDays);
		setMinutes(settings.minutes);
		setEquipment(settings.equipment);
		setFixed(settings.fixedDays);
		setSteps(
			Object.fromEntries(
				chains.map((chain) => [
					chain,
					progress.get(chain)?.step ?? defaultStep(chain, program.level),
				]),
			),
		);
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- resets when the sheet opens
	}, [visible]);

	const missing = program.equipment.filter((item) => !equipment.includes(item));
	// Thursday onwards, week 1 starts next Monday.
	const startsNow = (new Date().getDay() + 6) % 7 <= 2;
	const activityOn = (weekday: number) =>
		fixed.find((day) => day.weekday === weekday)?.activity ?? null;
	const nameOf = (id: string) =>
		activities.find((activity) => activity.id === id)?.name ??
		(id.startsWith("sport:") ? presetForKind(id.slice(6) as Sport).name : "Activity");
	const assign = (weekday: number, activity: string | null) => {
		setFixed((current) => [
			...current.filter((day) => day.weekday !== weekday),
			...(activity ? [{ weekday, activity }] : []),
		]);
		setEditingDay(null);
	};

	const start = async () => {
		setSaving(true);
		setNotice(null);
		try {
			const changed = Object.entries(steps).filter(
				([chain, step]) => progress.get(chain)?.step !== step,
			);
			await startProgram(
				settings,
				program,
				{
					daysPerWeek: days,
					minutes,
					equipment,
					fixedDays: fixed,
					steps: Object.fromEntries(changed) as Partial<Record<ChainId, number>>,
				},
				plan,
			);
			haptics.success();
			onStarted();
		} catch (error) {
			console.error("[training] could not start the program", error);
			setNotice("Couldn't save on this phone. Try again.");
		} finally {
			setSaving(false);
		}
	};

	const confirmStart = () => {
		if (!switchingFrom) {
			void start();
			return;
		}
		Alert.alert(
			`Switch from ${switchingFrom}?`,
			"Your levels and history stay. This week is planned again from the new program.",
			[
				{ text: "Keep it", style: "cancel" },
				{ text: "Switch", onPress: () => void start() },
			],
		);
	};

	return (
		<Sheet
			visible={visible}
			title={switchingFrom ? `Switch to ${program.title}` : `Start ${program.title}`}
			onClose={onClose}
			action={{
				label: saving ? "Starting…" : startsNow ? "Start this week" : "Start on Monday",
				onPress: confirmStart,
				disabled: saving,
			}}
		>
			<View style={styles.body}>
				<Label title="Days a week" />
				<View style={styles.wrap}>
					{dayOptions.map((count) => (
						<FilterChip
							key={count}
							label={String(count)}
							selected={days === count}
							onPress={() => setDays(count)}
						/>
					))}
				</View>
				<Label title="Usual session length" hint="Longer strength sessions are trimmed to fit." />
				<View style={styles.wrap}>
					{SESSION_LENGTHS.map((length) => (
						<FilterChip
							key={length}
							label={`${length} min`}
							selected={minutes === length}
							onPress={() => setMinutes(length)}
						/>
					))}
				</View>
				<Label
					title="What you can train with"
					hint="Anything you don't have is swapped for a match."
				/>
				<View style={styles.wrap}>
					{EQUIPMENT.map((item) => (
						<FilterChip
							key={item}
							label={EQUIPMENT_LABELS[item]}
							selected={equipment.includes(item)}
							onPress={() =>
								setEquipment((current) =>
									current.includes(item) ? current.filter((x) => x !== item) : [...current, item],
								)
							}
						/>
					))}
				</View>
				{missing.length > 0 ? (
					<PoText variant="meta13" tone="textWarning">
						{`This program uses ${missing.map((item) => EQUIPMENT_LABELS[item]).join(" and ")}. Those exercises will be swapped for ones you can do.`}
					</PoText>
				) : null}
				<Label
					title="Fixed days"
					hint="Matches, classes or club nights you already do. Tap a day, then pick the activity; training works around them."
				/>
				<View style={styles.wrap}>
					{WEEKDAYS.map((name, weekday) => {
						const activity = activityOn(weekday);
						return (
							<FilterChip
								key={name}
								label={activity ? `${name} · ${nameOf(activity)}` : name}
								selected={activity !== null || editingDay === weekday}
								onPress={() => setEditingDay(editingDay === weekday ? null : weekday)}
							/>
						);
					})}
				</View>
				{editingDay !== null ? (
					<View style={styles.wrap}>
						<FilterChip
							label="Nothing fixed"
							selected={activityOn(editingDay) === null}
							onPress={() => assign(editingDay, null)}
						/>
						{activities.map((activity) => (
							<FilterChip
								key={activity.id}
								label={activity.name}
								selected={activityOn(editingDay) === activity.id}
								onPress={() => assign(editingDay, activity.id)}
							/>
						))}
						{activities.length === 0 ? (
							<PoText variant="meta13" tone="textSecondary">
								Add your activities (football, swimming, a class) on Training Home to pin them here.
							</PoText>
						) : null}
					</View>
				) : null}
				{chains.length > 0 ? (
					<>
						<Label
							title="Where are you now?"
							hint="Pick the hardest one you can do for a few clean reps."
						/>
						{chains.map((chain) => (
							<View key={chain} style={styles.chain}>
								<PoText variant="meta13" tone="textSecondary">
									{CHAIN_LABELS[chain]}
								</PoText>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.row}
								>
									{CHAINS[chain].map((id, index) => (
										<FilterChip
											key={id}
											label={exerciseById(id)?.name ?? id}
											selected={steps[chain] === index}
											onPress={() => setSteps((current) => ({ ...current, [chain]: index }))}
										/>
									))}
								</ScrollView>
							</View>
						))}
					</>
				) : null}
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
	body: { gap: 12, paddingBottom: 8 },
	label: { gap: 2, marginTop: 4 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chain: { gap: 6 },
	row: { gap: 8, paddingVertical: 2 },
});
