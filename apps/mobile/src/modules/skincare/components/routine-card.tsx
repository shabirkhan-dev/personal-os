import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PoText } from "@/components/ui/po-text";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { doneCount, nextStepId } from "../lib/routine";
import type { RoutineKind, Step, StepsDone } from "../lib/skincare-types";
import { CardHead } from "./card-head";

export type RoutineCardProps = {
	kind: RoutineKind;
	steps: readonly Step[];
	done: StepsDone;
	onToggle: (stepId: string) => void;
	onEdit: () => void;
};

/** "Morning routine · 2 of 4 done": progress segments and tickable steps with the time done. */
export function RoutineCard({ kind, steps, done, onToggle, onEdit }: RoutineCardProps) {
	const { colors } = usePoTheme();
	const count = doneCount(steps, done);
	const next = nextStepId(steps, done);
	const title = kind === "morning" ? "Morning routine" : "Night routine";

	return (
		<Card style={styles.card}>
			<CardHead
				title={title}
				meta={steps.length > 0 ? `${count} of ${steps.length} done` : "No steps"}
			/>
			{steps.length > 0 ? (
				<View style={styles.progress}>
					{steps.map((step) => (
						<View
							key={step.id}
							style={[
								styles.segment,
								{ backgroundColor: done[step.id] ? colors.accentDefault : colors.bgSubtle },
							]}
						/>
					))}
				</View>
			) : (
				<PoText variant="meta13" tone="textTertiary" style={styles.empty}>
					Add the steps you do {kind === "morning" ? "each morning" : "before bed"}.
				</PoText>
			)}
			{steps.map((step, index) => (
				<StepRow
					key={step.id}
					step={step}
					doneAt={done[step.id]}
					isNext={step.id === next}
					divider={index < steps.length - 1}
					onPress={() => onToggle(step.id)}
				/>
			))}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Edit ${title.toLowerCase()}`}
				onPress={() => {
					haptics.tap();
					onEdit();
				}}
				style={[styles.edit, { borderTopColor: colors.borderDefault }]}
			>
				<Icon name="Filled/Edit" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					{steps.length > 0 ? "Edit routine" : "Add steps"}
				</PoText>
			</Pressable>
		</Card>
	);
}

type StepRowProps = {
	step: Step;
	doneAt: string | undefined;
	isNext: boolean;
	divider: boolean;
	onPress: () => void;
};

function StepRow({ step, doneAt, isNext, divider, onPress }: StepRowProps) {
	const { colors } = usePoTheme();
	const checked = Boolean(doneAt);
	return (
		<Pressable
			accessibilityRole="checkbox"
			accessibilityLabel={step.name}
			accessibilityState={{ checked }}
			onPress={() => {
				haptics.select();
				onPress();
			}}
			style={[
				styles.row,
				divider ? { borderBottomWidth: 1, borderBottomColor: colors.borderDefault } : null,
			]}
		>
			<Checkbox checked={checked} />
			<View style={styles.text}>
				<PoText variant="row15" tone={checked ? "textSecondary" : "textPrimary"} numberOfLines={1}>
					{step.name}
				</PoText>
				{step.detail ? (
					<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
						{step.detail}
					</PoText>
				) : null}
			</View>
			{doneAt ? (
				<PoText variant="mono13" tone="textTertiary">
					{clock(new Date(doneAt))}
				</PoText>
			) : isNext ? (
				<View style={[styles.next, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="eyebrow11">NEXT</PoText>
				</View>
			) : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: { gap: 6, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 6 },
	progress: { flexDirection: "row", gap: 4, paddingBottom: 6 },
	segment: { flex: 1, height: 4, borderRadius: 2 },
	empty: { paddingVertical: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	text: { flex: 1, gap: 2 },
	next: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
	edit: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 12,
		borderTopWidth: 1,
	},
});
