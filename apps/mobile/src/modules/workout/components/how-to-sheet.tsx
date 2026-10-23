import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { DEMO_CREDIT, guideFor } from "../lib/exercise-guide";
import { type Exercise, setsLabel } from "../lib/library";
import { ExerciseDemo } from "./exercise-demo";

/** How to do one exercise: the demo, three numbered cues and the sets it is planned for. */
export function HowToSheet({
	exercise,
	onClose,
}: {
	exercise: Exercise | null;
	onClose: () => void;
}) {
	const { colors } = usePoTheme();
	const guide = exercise ? guideFor(exercise.name) : null;

	return (
		<Sheet visible={exercise !== null} title={exercise?.name ?? ""} onClose={onClose}>
			{exercise ? (
				<View style={styles.body}>
					<ExerciseDemo name={exercise.name} photo={exercise.photo} height={200} radius={20} />
					<PoText variant="meta13" tone="textSecondary">
						{`${setsLabel(exercise)} · ${exercise.note}`}
					</PoText>
					{guide ? (
						<View style={styles.cues}>
							{guide.cues.map((cue, index) => (
								<View key={cue} style={styles.cue}>
									<View style={[styles.number, { backgroundColor: colors.bgSubtle }]}>
										<PoText variant="mono13">{index + 1}</PoText>
									</View>
									<PoText variant="body15" style={styles.flex}>
										{cue}
									</PoText>
								</View>
							))}
						</View>
					) : null}
					{guide?.demo ? (
						<PoText variant="meta13" tone="textTertiary">
							{DEMO_CREDIT}
						</PoText>
					) : null}
				</View>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	body: { gap: 14, paddingBottom: 8 },
	cues: { gap: 12 },
	cue: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
	number: {
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
	},
});
