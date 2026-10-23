import { Pressable, StyleSheet, View } from "react-native";
import { ProgressBar } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { weekKind } from "../lib/programs/engine";
import type { ProgramDef, ProgramLevel } from "../lib/programs/program-model";
import { TrainingImage } from "./training-image";

const LEVEL_LABELS: Record<ProgramLevel, string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advanced",
};

const KIND_LABELS = { build: "Build week", deload: "Light week", test: "Test week" } as const;

/** "3–6 days a week", from the week counts the program has a schedule for. */
export function programDays(program: ProgramDef): string {
	const counts = Object.keys(program.schedule)
		.map(Number)
		.sort((a, b) => a - b);
	const low = counts[0];
	const high = counts.at(-1);
	if (low === undefined || high === undefined) {
		const count = program.sessions.length;
		return `${count} ${count === 1 ? "session" : "sessions"}`;
	}
	return low === high ? `${low} days a week` : `${low}–${high} days a week`;
}

/** "8 weeks · Intermediate · 3–6 days a week" */
export function programMeta(program: ProgramDef): string {
	return `${program.weeks} weeks · ${LEVEL_LABELS[program.level]} · ${programDays(program)}`;
}

export function weekLabel(program: ProgramDef, week: number): string {
	return KIND_LABELS[weekKind(program, week)];
}

/** A program in the list: photo, title, goal and its length. */
export function ProgramRow({
	program,
	active,
	onPress,
}: {
	program: ProgramDef;
	active: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${program.title}${active ? ", following now" : ""}`}
			onPress={onPress}
			style={[
				styles.row,
				{
					backgroundColor: colors.bgSurface,
					borderColor: active ? colors.accentDefault : colors.borderDefault,
				},
			]}
		>
			<TrainingImage photo={program.photo} size={72} radius={18} />
			<View style={styles.flex}>
				<PoText variant="row15">{program.title}</PoText>
				<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
					{program.goal || program.summary}
				</PoText>
				<PoText variant="eyebrow11" tone={active ? "accentDefault" : "textTertiary"}>
					{active ? "Following now" : programMeta(program)}
				</PoText>
			</View>
		</Pressable>
	);
}

/** The program being followed: which week, how far through, and what kind of week it is. */
export function ActiveProgramCard({
	program,
	week,
	finished,
	onPress,
}: {
	program: ProgramDef;
	week: number;
	finished: boolean;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const shown = Math.max(1, Math.min(week, program.weeks));
	const upcoming = week < 1;
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.accentDefault },
			]}
		>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="accentDefault">
					{finished
						? "Program done"
						: upcoming
							? `Starts Monday · ${program.weeks} weeks`
							: `Week ${shown} of ${program.weeks} · ${weekLabel(program, shown)}`}
				</PoText>
			</View>
			<PoText variant="title18">{program.title}</PoText>
			<ProgressBar
				share={finished ? 1 : upcoming ? 0 : (shown - 1) / program.weeks}
				tone="accentDefault"
			/>
			<PoText variant="meta13" tone="textSecondary">
				{finished
					? "Nice work. Repeat it with your new levels, or pick the next program."
					: program.goal}
			</PoText>
		</Pressable>
	);
}

/** Training Home without a program: an invitation to follow one. */
export function ProgramPromptCard({ onPress }: { onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle }]}>
			<PoText variant="title18">Follow a program</PoText>
			<PoText variant="meta13" tone="textSecondary">
				Weeks with a goal, exercises that move up as you get stronger, built around your team days.
				Or design your own with AI.
			</PoText>
			<PillButton label="See programs" variant="secondary" onPress={onPress} />
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 3 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 12,
		borderRadius: 24,
		borderWidth: 1,
	},
	card: { gap: 10, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center" },
});
