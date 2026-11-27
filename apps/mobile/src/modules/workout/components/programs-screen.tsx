import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FilterChip, ListCard, ListRow, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useNow } from "@/lib/use-now";
import { useActiveProgram, useTraining } from "../hooks/use-training";
import type { ProgramKind } from "../lib/programs/program-model";
import { templateRoutes } from "@/modules/templates/navigation";
import { trainingRoutes } from "../navigation";
import { Card } from "./home-cards";
import { ActiveProgramCard, ProgramRow } from "./program-cards";
import { TrainingScreen } from "./training-screen";

type Filter = "all" | ProgramKind | "yours";

const FILTERS: readonly { id: Filter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "hybrid", label: "Hybrid" },
	{ id: "strength", label: "Strength" },
	{ id: "skill", label: "Skills" },
	{ id: "running", label: "Running" },
	{ id: "boxing", label: "Boxing" },
	{ id: "conditioning", label: "Fat loss" },
	{ id: "recovery", label: "Recovery" },
	{ id: "gym", label: "Gym" },
	{ id: "yours", label: "Yours" },
];

/** Programs: the one being followed and the person's own (made here, with AI, or imported). */
export function ProgramsScreen() {
	const data = useTraining();
	const now = useNow();
	const active = useActiveProgram(data, now);
	const [filter, setFilter] = useState<Filter>("all");
	const list =
		filter === "yours"
			? data.customPrograms
			: data.programs.filter((program) => filter === "all" || program.kind === filter);

	return (
		<TrainingScreen
			action={{
				icon: "Filled/Sparkle",
				label: "Design with AI",
				onPress: () => trainingRoutes.builder({ ai: true }),
			}}
		>
			<ScreenTitle eyebrow="Training" title="Programs" />
			{active ? (
				<ActiveProgramCard
					program={active.program}
					week={active.week}
					finished={active.finished}
					onPress={() => trainingRoutes.program(active.program.id)}
				/>
			) : null}
			<Card>
				<PoText variant="title18">Make your own</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Describe your goal and AI drafts the program and the exercises it needs, or build one
					exercise by exercise. Targets rise as you hit them.
				</PoText>
				<View style={styles.buttons}>
					<PillButton
						label="Design with AI"
						style={styles.flex}
						onPress={() => trainingRoutes.builder({ ai: true })}
					/>
					<PillButton
						label="Build by hand"
						variant="secondary"
						style={styles.flex}
						onPress={() => trainingRoutes.builder()}
					/>
				</View>
			</Card>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
				style={data.programs.length === 0 ? styles.hidden : null}
			>
				{FILTERS.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={filter === item.id}
						onPress={() => setFilter(item.id)}
					/>
				))}
			</ScrollView>
			<View style={styles.list}>
				{list.map((program) => (
					<ProgramRow
						key={program.id}
						program={program}
						active={active?.program.id === program.id}
						onPress={() => trainingRoutes.program(program.id)}
					/>
				))}
				{list.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary">
						{data.programs.length === 0
							? "No programs yet. Make your own above, or import one made with any AI from Templates."
							: filter === "yours"
								? "Programs you design show up here."
								: "No programs of this kind yet."}
					</PoText>
				) : null}
			</View>
			<ListCard>
				<ListRow
					title="Import a program"
					subtitle="Have any AI make one in the template format, then open it here"
					icon={{ name: "Layers", tone: "accentDefault", tile: "accentSubtle" }}
					chevron
					onPress={() => templateRoutes.browse("training")}
				/>
				<ListRow
					title="Your exercises"
					subtitle="Yours, with cues, photos and videos; import more from Templates"
					icon={{ name: "Dumbbell", tone: "accentDefault", tile: "accentSubtle" }}
					chevron
					last
					onPress={trainingRoutes.exercises}
				/>
			</ListCard>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	buttons: { flexDirection: "row", gap: 12 },
	chips: { gap: 8, paddingVertical: 2 },
	list: { gap: 12 },
	hidden: { display: "none" },
});
