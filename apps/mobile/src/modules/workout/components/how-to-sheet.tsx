import { Linking, StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { DEMO_CREDIT, guideFor, videoSearchUrl } from "../lib/exercise-guide";
import { type Exercise, setsLabel } from "../lib/library";
import { ExerciseDemo } from "./exercise-demo";

export type HowToTarget = {
	name: string;
	photo: string;
	/** Under the demo: "4 × 8 · Rest 90 s", or "Push · level 2" from the library. */
	line: string;
};

/** The line for an exercise in a session. */
export function plannedLine(exercise: Exercise): string {
	return `${setsLabel(exercise)} · ${exercise.note}`;
}

/**
 * How to do one exercise: the demo, three numbered cues, and a video search for when photos aren't
 * enough (it opens YouTube, outside the app).
 */
export function HowToSheet({
	target,
	onClose,
}: {
	target: HowToTarget | null;
	onClose: () => void;
}) {
	const { colors } = usePoTheme();
	const guide = target ? guideFor(target.name) : null;

	const watch = () => {
		if (!target) return;
		Linking.openURL(videoSearchUrl(target.name)).catch((error: unknown) =>
			console.warn("[training] could not open the video search", error),
		);
	};

	return (
		<Sheet visible={target !== null} title={target?.name ?? ""} onClose={onClose}>
			{target ? (
				<View style={styles.body}>
					<ExerciseDemo name={target.name} photo={target.photo} height={200} radius={20} />
					<PoText variant="meta13" tone="textSecondary">
						{target.line}
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
					<PillButton label="Watch a video" variant="secondary" onPress={watch} />
					<PoText variant="meta13" tone="textTertiary">
						{guide?.demo ? `${DEMO_CREDIT}. Videos open on YouTube.` : "Videos open on YouTube."}
					</PoText>
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
