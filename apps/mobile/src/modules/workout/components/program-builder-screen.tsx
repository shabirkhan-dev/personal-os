import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { savePlan, saveProgram, weekSlots } from "../data/training-actions";
import { useTraining } from "../hooks/use-training";
import { type CatalogExercise, exerciseById } from "../lib/exercise-guide";
import { defaultStep, pickRung } from "../lib/programs/engine";
import { itemFor, programFromDraft } from "../lib/programs/draft";
import {
	CHAIN_LABELS,
	CHAINS,
	LEVELS,
	type ProgramDef,
	type ProgramItem,
	type ProgramLevel,
	type ProgramSession,
} from "../lib/programs/program-model";
import { weekDays } from "../lib/training-math";
import { SPORT_LABELS, type Sport, type TrainingSettings } from "../lib/training-model";
import { trainingAiMessage, useTrainingAi } from "../services/training-ai";
import { ExerciseThumb } from "./exercise-demo";
import { ExercisePickerSheet } from "./exercise-picker";
import { Card } from "./home-cards";
import { trainingRoutes } from "../navigation";
import { TrainingScreen } from "./training-screen";

const WEEK_OPTIONS = [4, 6, 8, 12] as const;
const SESSION_SPORTS: readonly Sport[] = ["calisthenics", "running", "boxing", "yoga", "gym"];
const LEVEL_LABELS: Record<ProgramLevel, string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advanced",
};

function newSession(index: number): ProgramSession {
	return {
		key: `s${index}-${newId().slice(-4)}`,
		title: `Session ${index}`,
		sport: "calisthenics",
		focus: "full",
		minutes: 45,
		effort: 6,
		items: [],
	};
}

function emptyProgram(settings: TrainingSettings): ProgramDef {
	return {
		id: newId(),
		title: "",
		goal: "",
		summary: "",
		kind: "strength",
		weeks: 8,
		level: "beginner",
		sports: ["calisthenics"],
		equipment: settings.equipment,
		photo: "handstand",
		sessions: [newSession(1)],
		schedule: {},
		deloadEvery: 4,
		testWeeks: false,
		source: "custom",
		createdAt: null,
	};
}

/** "3 × 8–12 · rest 60 s" */
function itemLine(item: ProgramItem): string {
	const unit =
		item.kind === "exercise" ? (exerciseById(item.exercise)?.unit ?? "reps") : ("reps" as const);
	const amount =
		item.range[0] === item.range[1] ? `${item.range[0]}` : `${item.range[0]}–${item.range[1]}`;
	const label = unit === "min" ? `${amount} min` : unit === "s" ? `${amount} s` : amount;
	return `${item.sets} × ${label}${item.restS ? ` · rest ${item.restS} s` : ""}`;
}

/**
 * Design a program: describe a goal and AI drafts it from the exercise library, or build it by
 * hand. Exercises on a ladder move up variations; everything can be edited before saving.
 */
export function ProgramBuilderScreen({ id, ai }: { id?: string; ai: boolean }) {
	const { colors } = usePoTheme();
	const data = useTraining();
	const assistant = useTrainingAi();
	const existing = id ? data.customPrograms.find((program) => program.id === id) : undefined;
	const [draft, setDraft] = useState<ProgramDef>(() => existing ?? emptyProgram(data.settings));
	const loaded = useRef(existing !== undefined);
	const [goal, setGoal] = useState(existing?.goal ?? "");
	const [level, setLevel] = useState<ProgramLevel>(existing?.level ?? "beginner");
	const [busy, setBusy] = useState(false);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [picking, setPicking] = useState<string | null>(null);
	const [editing, setEditing] = useState<{ session: string; index: number } | null>(null);

	// Editing a program that loads after the first render.
	useEffect(() => {
		if (loaded.current || !existing) return;
		loaded.current = true;
		setDraft(existing);
		setGoal(existing.goal);
		setLevel(existing.level);
	}, [existing]);

	const updateSession = (key: string, change: (session: ProgramSession) => ProgramSession) =>
		setDraft((current) => ({
			...current,
			sessions: current.sessions.map((session) =>
				session.key === key ? change(session) : session,
			),
		}));

	const design = async () => {
		if (goal.trim().length < 3) {
			setNotice("Say what you want to achieve first, like “first muscle-up in 8 weeks”.");
			return;
		}
		setBusy(true);
		setNotice(null);
		const request = {
			goal: goal.trim(),
			level,
			weeks: draft.weeks,
			daysPerWeek: data.settings.daysPerWeek,
			minutes: data.settings.minutes,
			sports: data.settings.sports,
			equipment: data.settings.equipment,
		};
		try {
			const result = await assistant.program(request);
			const program = programFromDraft(result, request);
			setDraft({ ...program, id: draft.id, createdAt: draft.createdAt });
			haptics.success();
		} catch (error) {
			console.warn("[training] AI program draft failed", error);
			setNotice(trainingAiMessage(error));
		} finally {
			setBusy(false);
		}
	};

	const addExercise = (sessionKey: string, exercise: CatalogExercise) => {
		const range: [number, number] =
			exercise.unit === "s" ? [20, 40] : exercise.unit === "min" ? [10, 10] : [8, 12];
		// The exercise picked is the one trained; the item sheet can turn it into a ladder.
		const item: ProgramItem = {
			kind: "exercise",
			exercise: exercise.id,
			sets: exercise.unit === "min" ? 1 : 3,
			range,
			restS: exercise.unit === "min" ? 0 : 60,
		};
		setPicking(null);
		haptics.tap();
		updateSession(sessionKey, (session) => ({ ...session, items: [...session.items, item] }));
	};

	const save = async () => {
		const sessions = draft.sessions
			.map((session) => ({ ...session, title: session.title.trim() || "Session" }))
			.filter((session) => session.items.length > 0);
		if (sessions.length === 0) {
			setNotice("Add at least one exercise to a session.");
			return;
		}
		const keys = new Set(sessions.map((session) => session.key));
		const schedule = Object.fromEntries(
			Object.entries(draft.schedule)
				.map(([count, order]) => [count, (order ?? []).filter((key) => keys.has(key))])
				.filter(([, order]) => order.length > 0),
		);
		const program: ProgramDef = {
			...draft,
			title: draft.title.trim() || goal.trim().slice(0, 40) || "My program",
			goal: goal.trim() || draft.goal,
			level,
			sessions,
			schedule,
			sports: [...new Set(sessions.map((session) => session.sport))],
			equipment: data.settings.equipment,
			testWeeks: sessions.some((session) => session.items.some((item) => item.kind === "chain")),
			createdAt: draft.createdAt ?? new Date().toISOString(),
		};
		setSaving(true);
		setNotice(null);
		try {
			await saveProgram(program);
			// A program being followed re-plans this week with its new sessions.
			if (data.settings.program?.id === program.id) {
				const days = weekDays(new Date());
				await savePlan(days[0] ?? "", weekSlots(data.settings, program, days));
			}
			haptics.success();
			router.replace({ pathname: "/training/program/[id]", params: { id: program.id } });
		} catch (error) {
			console.error("[training] could not save the program", error);
			setNotice("Couldn't save on this phone. Try again.");
			setSaving(false);
		}
	};

	const editingItem = editing
		? draft.sessions.find((session) => session.key === editing.session)?.items[editing.index]
		: undefined;

	return (
		<TrainingScreen>
			<ScreenTitle
				eyebrow={existing ? "Edit program" : "New program"}
				title={draft.title || "Design a program"}
			/>
			<Card accent={ai}>
				<View style={styles.aiHead}>
					<Icon name="Filled/Sparkle" size={16} color={colors.accentDefault} />
					<PoText variant="title18">Design with AI</PoText>
				</View>
				<PoText variant="meta13" tone="textSecondary">
					{`Uses your ${data.settings.daysPerWeek} days a week, ${data.settings.minutes} min sessions and your equipment. You can change everything after.`}
				</PoText>
				<TextField
					label="Your goal"
					value={goal}
					onChangeText={setGoal}
					placeholder="First muscle-up and a faster 5 km"
				/>
				<View style={styles.wrap}>
					{LEVELS.map((item) => (
						<FilterChip
							key={item}
							label={LEVEL_LABELS[item]}
							selected={level === item}
							onPress={() => setLevel(item)}
						/>
					))}
				</View>
				<PillButton
					label={
						busy
							? "Designing…"
							: draft.sessions.some((s) => s.items.length > 0)
								? "Draft again"
								: "Draft with AI"
					}
					disabled={busy || !assistant.available}
					accessory={
						busy ? <ActivityIndicator size="small" color={colors.textInverse} /> : undefined
					}
					onPress={() => void design()}
				/>
				{!assistant.available ? (
					<PoText variant="meta13" tone="textSecondary">
						Sign in from Profile to design with AI. Building by hand works offline.
					</PoText>
				) : null}
			</Card>
			<Card>
				<TextField
					label="Program name"
					value={draft.title}
					onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
					placeholder="My calisthenics block"
				/>
				<PoText variant="meta13" tone="textSecondary">
					Length
				</PoText>
				<View style={styles.wrap}>
					{WEEK_OPTIONS.map((weeks) => (
						<FilterChip
							key={weeks}
							label={`${weeks} weeks`}
							selected={draft.weeks === weeks}
							onPress={() => setDraft((current) => ({ ...current, weeks }))}
						/>
					))}
				</View>
			</Card>
			{draft.sessions.map((session, sessionIndex) => (
				<Card key={session.key}>
					<View style={styles.sessionHead}>
						<View style={styles.flex}>
							<TextField
								label={`Session ${sessionIndex + 1}`}
								value={session.title}
								onChangeText={(title) =>
									updateSession(session.key, (current) => ({ ...current, title }))
								}
							/>
						</View>
						{draft.sessions.length > 1 ? (
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={`Remove ${session.title}`}
								hitSlop={8}
								onPress={() =>
									setDraft((current) => ({
										...current,
										sessions: current.sessions.filter((item) => item.key !== session.key),
									}))
								}
								style={[styles.round, { backgroundColor: colors.bgSubtle }]}
							>
								<Icon name="Line/Close" size={16} color={colors.textSecondary} />
							</Pressable>
						) : null}
					</View>
					<View style={styles.wrap}>
						{SESSION_SPORTS.map((sport) => (
							<FilterChip
								key={sport}
								label={SPORT_LABELS[sport]}
								selected={session.sport === sport}
								onPress={() =>
									updateSession(session.key, (current) => ({
										...current,
										sport,
										focus:
											sport === "running" ? "run" : sport === "yoga" ? "mobility" : current.focus,
									}))
								}
							/>
						))}
					</View>
					{session.items.map((item, index) => (
						<ItemRow
							key={`${session.key}-${index}`}
							item={item}
							settings={data.settings}
							progress={data.progress}
							level={level}
							onPress={() => setEditing({ session: session.key, index })}
						/>
					))}
					<PillButton
						label="Add exercise"
						variant="secondary"
						showPlus
						onPress={() => setPicking(session.key)}
					/>
				</Card>
			))}
			{draft.sessions.length < 7 ? (
				<PillButton
					label="Add session"
					variant="ghost"
					showPlus
					onPress={() =>
						setDraft((current) => ({
							...current,
							sessions: [...current.sessions, newSession(current.sessions.length + 1)],
						}))
					}
				/>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textDanger">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Cancel"
					variant="secondary"
					style={styles.flex}
					onPress={() => trainingRoutes.back("/training/programs")}
				/>
				<PillButton
					label={saving ? "Saving…" : "Save program"}
					disabled={saving || busy}
					style={styles.flex}
					onPress={() => void save()}
				/>
			</Footer>
			<ExercisePickerSheet
				visible={picking !== null}
				equipment={data.settings.equipment}
				onPick={(exercise) => (picking ? addExercise(picking, exercise) : undefined)}
				onClose={() => setPicking(null)}
			/>
			<ItemSheet
				item={editingItem ?? null}
				settings={data.settings}
				level={level}
				progress={data.progress}
				onClose={() => setEditing(null)}
				onChange={(next) => {
					if (!editing) return;
					updateSession(editing.session, (session) => ({
						...session,
						items: session.items.map((item, index) => (index === editing.index ? next : item)),
					}));
				}}
				onRemove={() => {
					if (!editing) return;
					updateSession(editing.session, (session) => ({
						...session,
						items: session.items.filter((_, index) => index !== editing.index),
					}));
					setEditing(null);
				}}
			/>
		</TrainingScreen>
	);
}

/** The exercise an item trains for this person now: a ladder's current rung, or the exercise. */
function currentExercise(
	item: ProgramItem,
	settings: TrainingSettings,
	progress: ReturnType<typeof useTraining>["progress"],
	level: ProgramLevel,
) {
	if (item.kind === "exercise") return exerciseById(item.exercise);
	const saved = progress.get(item.chain);
	return (
		pickRung(item.chain, saved?.step ?? defaultStep(item.chain, level), settings.equipment)
			?.exercise ?? null
	);
}

function ItemRow({
	item,
	settings,
	progress,
	level,
	onPress,
}: {
	item: ProgramItem;
	settings: TrainingSettings;
	progress: ReturnType<typeof useTraining>["progress"];
	level: ProgramLevel;
	onPress: () => void;
}) {
	const exercise = currentExercise(item, settings, progress, level);
	return (
		<Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
			{exercise ? <ExerciseThumb name={exercise.name} photo={exercise.photo} size={44} /> : null}
			<View style={styles.flex}>
				<PoText variant="row15">
					{item.kind === "chain"
						? `${CHAIN_LABELS[item.chain]} ladder`
						: (exercise?.name ?? "Exercise")}
				</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{item.kind === "chain"
						? `Now: ${exercise?.name ?? "needs equipment"} · ${itemLine(item)}`
						: itemLine(item)}
				</PoText>
			</View>
		</Pressable>
	);
}

function Stepper({
	label,
	value,
	step,
	min,
	max,
	onChange,
}: {
	label: string;
	value: number;
	step: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.stepperRow}>
			<PoText variant="row15" style={styles.flex}>
				{label}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Less ${label}`}
				onPress={() => onChange(Math.max(min, value - step))}
				style={[styles.round, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Minus" size={16} color={colors.textPrimary} />
			</Pressable>
			<PoText variant="mono13" style={styles.value}>
				{String(value)}
			</PoText>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`More ${label}`}
				onPress={() => onChange(Math.min(max, value + step))}
				style={[styles.round, { backgroundColor: colors.bgSubtle }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textPrimary} />
			</Pressable>
		</View>
	);
}

/** Sets, the target range, rest, ladder or fixed exercise, and remove. */
function ItemSheet({
	item,
	settings,
	level,
	progress,
	onChange,
	onRemove,
	onClose,
}: {
	item: ProgramItem | null;
	settings: TrainingSettings;
	level: ProgramLevel;
	progress: ReturnType<typeof useTraining>["progress"];
	onChange: (item: ProgramItem) => void;
	onRemove: () => void;
	onClose: () => void;
}) {
	if (!item)
		return (
			<Sheet visible={false} title="" onClose={onClose}>
				{null}
			</Sheet>
		);
	const exercise = currentExercise(item, settings, progress, level);
	const unit = item.kind === "exercise" ? (exercise?.unit ?? "reps") : "reps";
	const unitLabel = unit === "min" ? "minutes" : unit === "s" ? "seconds" : "reps";
	const max = unit === "s" ? 300 : unit === "min" ? 180 : 100;
	const step = unit === "s" ? 5 : 1;
	const holds =
		item.kind === "chain" && CHAINS[item.chain].some((id) => exerciseById(id)?.unit === "s");
	const chainOf = exercise
		? (Object.entries(CHAINS).find(([, rungs]) => rungs.includes(exercise.id))?.[0] ?? null)
		: null;

	const setRange = (low: number, high: number) =>
		onChange({ ...item, range: [low, Math.max(low, high)] });

	return (
		<Sheet
			visible
			title={
				item.kind === "chain"
					? `${CHAIN_LABELS[item.chain]} ladder`
					: (exercise?.name ?? "Exercise")
			}
			onClose={onClose}
			footer={
				<View style={styles.sheetFooter}>
					<PillButton label="Remove" variant="secondary" style={styles.flex} onPress={onRemove} />
					<PillButton label="Done" style={styles.flex} onPress={onClose} />
				</View>
			}
		>
			<View style={styles.sheetBody}>
				<Stepper
					label="Sets"
					value={item.sets}
					step={1}
					min={1}
					max={10}
					onChange={(sets) => onChange({ ...item, sets })}
				/>
				<Stepper
					label={`Low (${unitLabel})`}
					value={item.range[0]}
					step={step}
					min={1}
					max={max}
					onChange={(low) => setRange(low, item.range[1])}
				/>
				<Stepper
					label={`High (${unitLabel})`}
					value={item.range[1]}
					step={step}
					min={item.range[0]}
					max={max}
					onChange={(high) => setRange(item.range[0], high)}
				/>
				{item.kind === "chain" && holds ? (
					<>
						<Stepper
							label="Hold low (s)"
							value={item.hold[0]}
							step={5}
							min={5}
							max={300}
							onChange={(low) => onChange({ ...item, hold: [low, Math.max(low, item.hold[1])] })}
						/>
						<Stepper
							label="Hold high (s)"
							value={item.hold[1]}
							step={5}
							min={item.hold[0]}
							max={300}
							onChange={(high) => onChange({ ...item, hold: [item.hold[0], high] })}
						/>
					</>
				) : null}
				<Stepper
					label="Rest (s)"
					value={item.restS}
					step={15}
					min={0}
					max={300}
					onChange={(restS) => onChange({ ...item, restS })}
				/>
				{item.kind === "chain" && exercise ? (
					<PillButton
						label={`Always do ${exercise.name}`}
						variant="ghost"
						onPress={() =>
							onChange({
								kind: "exercise",
								exercise: exercise.id,
								sets: item.sets,
								range: exercise.unit === "s" ? item.hold : item.range,
								restS: item.restS,
							})
						}
					/>
				) : null}
				{item.kind === "exercise" && chainOf && exercise ? (
					<PillButton
						label="Move up variations as I get stronger"
						variant="ghost"
						onPress={() => {
							const next = itemFor({
								exercise: exercise.id,
								sets: item.sets,
								range: [item.range[0], item.range[1]],
								restS: item.restS,
							});
							if (next) onChange(next);
						}}
					/>
				) : null}
				<PoText variant="meta13" tone="textSecondary">
					{item.kind === "chain"
						? "A ladder trains the variation at your level and moves up when you hit the top of the range on every set."
						: "Hit the top of the range on every set and the target goes up next time."}
				</PoText>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	sessionHead: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	round: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	value: { minWidth: 40, textAlign: "center" },
	sheetBody: { gap: 12, paddingBottom: 8 },
	sheetFooter: { flexDirection: "row", gap: 10 },
});
