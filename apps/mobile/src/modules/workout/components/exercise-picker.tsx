import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { usePoTheme } from "@/theme";
import { useTraining } from "../hooks/use-training";
import {
	CATALOG,
	type CatalogExercise,
	canDo,
	type Equipment,
	EQUIPMENT_LABELS,
	PATTERN_LABELS,
	PATTERNS,
	type Pattern,
} from "../lib/exercise-guide";
import { ExerciseThumb } from "./exercise-demo";
import { HowToSheet, type HowToTarget } from "./how-to-sheet";
import { TrainingScreen } from "./training-screen";

/** "Pull-ups · level 4 · Pull-up bar" */
export function catalogLine(exercise: CatalogExercise): string {
	const needs = exercise.equipment.map((item) => EQUIPMENT_LABELS[item]).join(", ");
	return `${PATTERN_LABELS[exercise.pattern]} · level ${exercise.level}${needs ? ` · ${needs}` : ""}`;
}

const PICKABLE: readonly Pattern[] = PATTERNS.filter((pattern) => pattern !== "sport");

function useFiltered(
	query: string,
	pattern: Pattern | null,
	equipment: readonly Equipment[] | null,
) {
	return useMemo(() => {
		const words = query.trim().toLowerCase();
		return CATALOG.filter(
			(exercise) =>
				exercise.pattern !== "sport" &&
				(pattern === null || exercise.pattern === pattern) &&
				(equipment === null || canDo(exercise, equipment)) &&
				(!words || exercise.name.toLowerCase().includes(words)),
		);
	}, [query, pattern, equipment]);
}

/** Search, pattern chips and an "only what I can do" switch. */
function Filters({
	query,
	onQuery,
	pattern,
	onPattern,
	mine,
	onMine,
}: {
	query: string;
	onQuery: (value: string) => void;
	pattern: Pattern | null;
	onPattern: (value: Pattern | null) => void;
	mine: boolean;
	onMine: (value: boolean) => void;
}) {
	return (
		<View style={styles.filters}>
			<TextField
				label="Search"
				value={query}
				onChangeText={onQuery}
				placeholder="Push-ups, plank…"
			/>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
			>
				<FilterChip label="My equipment" selected={mine} onPress={() => onMine(!mine)} />
				<FilterChip label="All" selected={pattern === null} onPress={() => onPattern(null)} />
				{PICKABLE.map((item) => (
					<FilterChip
						key={item}
						label={PATTERN_LABELS[item]}
						selected={pattern === item}
						onPress={() => onPattern(pattern === item ? null : item)}
					/>
				))}
			</ScrollView>
		</View>
	);
}

function ExerciseRow({
	exercise,
	onPress,
	last,
}: {
	exercise: CatalogExercise;
	onPress: () => void;
	last: boolean;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.row,
				last ? null : { borderBottomWidth: 1, borderBottomColor: colors.borderDefault },
			]}
		>
			<ExerciseThumb name={exercise.name} photo={exercise.photo} size={48} />
			<View style={styles.flex}>
				<PoText variant="row15">{exercise.name}</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{catalogLine(exercise)}
				</PoText>
			</View>
			{exercise.demo ? (
				<PoText variant="eyebrow11" tone="textTertiary">
					Demo
				</PoText>
			) : null}
		</Pressable>
	);
}

/** Picks an exercise to add to a designed program. */
export function ExercisePickerSheet({
	visible,
	equipment,
	onPick,
	onClose,
}: {
	visible: boolean;
	equipment: readonly Equipment[];
	onPick: (exercise: CatalogExercise) => void;
	onClose: () => void;
}) {
	const [query, setQuery] = useState("");
	const [pattern, setPattern] = useState<Pattern | null>(null);
	const [mine, setMine] = useState(true);
	const list = useFiltered(query, pattern, mine ? equipment : null);

	return (
		<Sheet visible={visible} title="Add an exercise" onClose={onClose}>
			<Filters
				query={query}
				onQuery={setQuery}
				pattern={pattern}
				onPattern={setPattern}
				mine={mine}
				onMine={setMine}
			/>
			<View>
				{list.slice(0, 60).map((exercise, index) => (
					<ExerciseRow
						key={exercise.id}
						exercise={exercise}
						last={index === Math.min(list.length, 60) - 1}
						onPress={() => onPick(exercise)}
					/>
				))}
				{list.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary">
						Nothing matches. Try another word, or turn off "My equipment".
					</PoText>
				) : null}
			</View>
		</Sheet>
	);
}

/** Every exercise Training knows, with its demo, cues and a video link. */
export function ExerciseLibraryScreen() {
	const { colors } = usePoTheme();
	const { settings } = useTraining();
	const [query, setQuery] = useState("");
	const [pattern, setPattern] = useState<Pattern | null>(null);
	const [mine, setMine] = useState(false);
	const [open, setOpen] = useState<HowToTarget | null>(null);
	const list = useFiltered(query, pattern, mine ? settings.equipment : null);

	return (
		<TrainingScreen>
			<ScreenTitle eyebrow={`${list.length} exercises`} title="Exercise library" />
			<Filters
				query={query}
				onQuery={setQuery}
				pattern={pattern}
				onPattern={setPattern}
				mine={mine}
				onMine={setMine}
			/>
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{list.map((exercise, index) => (
					<ExerciseRow
						key={exercise.id}
						exercise={exercise}
						last={index === list.length - 1}
						onPress={() =>
							setOpen({ name: exercise.name, photo: exercise.photo, line: catalogLine(exercise) })
						}
					/>
				))}
				{list.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary" style={styles.empty}>
						Nothing matches that search.
					</PoText>
				) : null}
			</View>
			<HowToSheet target={open} onClose={() => setOpen(null)} />
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	filters: { gap: 10 },
	chips: { gap: 8, paddingVertical: 2 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
	card: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
	empty: { paddingVertical: 16 },
});
