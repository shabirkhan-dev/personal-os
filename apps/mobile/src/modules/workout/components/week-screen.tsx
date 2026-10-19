import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { rebalanceWeek, savePlan } from "../data/training-actions";
import { useTrainingToday } from "../hooks/use-training";
import { TEMPLATES, templateById } from "../lib/library";
import { buildWeek, type SlotState, slotState, weekdayShort, withSlot } from "../lib/training-math";
import { SPORT_LABELS } from "../lib/training-model";
import { trainingRoutes } from "../navigation";
import { SPORT_TONES } from "./home-cards";
import { TrainingImage } from "./training-image";
import { TrainingScreen } from "./training-screen";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** This week: each day's session and whether it's done, missed or moved; edit or rebalance. */
export function WeekScreen() {
	const { colors } = usePoTheme();
	const { data, plan, today, week } = useTrainingToday();
	const { settings, sessions } = data;
	const [editing, setEditing] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const failed = (error: unknown) => {
		console.error("[training] could not save", error);
		setNotice("Couldn't save on this phone. Try again.");
	};
	const slots = plan?.slots ?? buildWeek(settings, week);
	const sessionsCount = slots.filter(
		(slot) => slot.template && slot.template !== "mobility",
	).length;
	const easyCount = slots.length - sessionsCount;

	const label = (
		state: SlotState,
		movedTo: string | null,
		day: string,
	): { text: string; tone: "textSuccess" | "textWarning" | "accentDefault" | "textTertiary" } => {
		if (state === "done") return { text: "Done", tone: "textSuccess" };
		if (state === "missed")
			return {
				text: movedTo
					? `Missed · moved to ${DAY_NAMES[new Date(`${movedTo}T12:00:00`).getDay()]}`
					: "Missed",
				tone: "textWarning",
			};
		if (state === "today") return { text: clockOf(settings.trainAt), tone: "accentDefault" };
		if (state === "rest") return { text: "Rest", tone: "textTertiary" };
		return { text: day > today ? "Planned" : "", tone: "textTertiary" };
	};

	const setDay = (day: string, template: string | null) => {
		setEditing(null);
		if (!plan) return;
		haptics.tap();
		void savePlan(plan.id, withSlot(plan.slots, day, template)).catch(failed);
	};

	return (
		<TrainingScreen
			action={{ icon: "Filled/Edit", label: "Edit week", onPress: () => setEditing(today) }}
		>
			<ScreenTitle
				eyebrow={`Phase ${settings.phase} · ${sessionsCount} sessions + ${easyCount} easy days`}
				title="This week"
			/>
			{slots.map((slot) => {
				const template = templateById(slot.template);
				const state = slotState(slot, sessions, today);
				const moved = slots.find((other) => other.movedFrom === slot.day)?.day ?? null;
				const right = label(state, moved, slot.day);
				const isToday = slot.day === today;
				return (
					<Pressable
						key={slot.day}
						accessibilityRole="button"
						onPress={() => (template ? trainingRoutes.plan(template.id) : setEditing(slot.day))}
						onLongPress={() => setEditing(slot.day)}
						style={[
							styles.day,
							{
								backgroundColor: colors.bgSurface,
								borderColor: isToday ? colors.accentDefault : colors.borderDefault,
							},
						]}
					>
						<PoText
							variant="mono13"
							tone={isToday ? "accentDefault" : "textSecondary"}
							style={styles.name}
						>
							{weekdayShort(slot.day)}
						</PoText>
						<View
							style={[
								styles.bar,
								{
									backgroundColor: template
										? colors[SPORT_TONES[template.sport]]
										: colors.borderDefault,
								},
							]}
						/>
						<View style={styles.flex}>
							<PoText variant="row15" tone={state === "missed" ? "textSecondary" : "textPrimary"}>
								{template?.title ?? "Rest"}
							</PoText>
							<PoText variant="meta13" tone="textTertiary">
								{slot.movedFrom
									? `Moved from ${DAY_NAMES[new Date(`${slot.movedFrom}T12:00:00`).getDay()]}`
									: (template?.short ?? "Walk, stretch or nothing")}
							</PoText>
						</View>
						<PoText variant="meta13" tone={right.tone}>
							{right.text}
						</PoText>
					</Pressable>
				);
			})}
			{settings.phase === 1 ? (
				<View style={[styles.next, { borderColor: colors.borderStrong }]}>
					<PoText variant="eyebrow11" tone="textTertiary">
						Phase 2 adds
					</PoText>
					<View style={styles.phase}>
						{[
							{ photo: "football", name: "Football team" },
							{ photo: "volleyball", name: "Volleyball team" },
						].map((item) => (
							<View key={item.name} style={styles.phaseItem}>
								<TrainingImage photo={item.photo} size={40} radius={10} />
								<PoText variant="meta13" tone="textSecondary">
									{item.name}
								</PoText>
							</View>
						))}
					</View>
				</View>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<PoText variant="meta13" tone="textTertiary" style={styles.hint}>
				Tap a day to open it. Long press to change it.
			</PoText>
			<Footer>
				<PillButton
					label="Edit week"
					variant="secondary"
					style={styles.flex}
					onPress={() => setEditing(today)}
				/>
				<PillButton
					label="Rebalance"
					style={styles.flex}
					onPress={() => {
						if (!plan) return;
						void rebalanceWeek(plan, sessions, today)
							.then((next) => {
								haptics.success();
								const moved = next.slots.filter((slot) => slot.movedFrom).length;
								setNotice(
									moved
										? `Moved ${moved} missed session${moved === 1 ? "" : "s"} to an easy day.`
										: "Nothing to move: the week is on track.",
								);
							})
							.catch(failed);
					}}
				/>
			</Footer>
			<Sheet
				visible={editing !== null}
				title={editing ? `${DAY_NAMES[new Date(`${editing}T12:00:00`).getDay()]}'s session` : ""}
				onClose={() => setEditing(null)}
			>
				<View style={styles.sheet}>
					<View style={styles.chips}>
						{week.map((day) => (
							<Pressable
								key={day}
								accessibilityRole="radio"
								accessibilityState={{ selected: day === editing }}
								onPress={() => setEditing(day)}
								style={[
									styles.chip,
									{ backgroundColor: day === editing ? colors.accentDefault : colors.bgSubtle },
								]}
							>
								<PoText variant="meta13" tone={day === editing ? "textOnAccent" : "textSecondary"}>
									{DAY_NAMES[new Date(`${day}T12:00:00`).getDay()]}
								</PoText>
							</Pressable>
						))}
					</View>
					{[
						null,
						...TEMPLATES.filter(
							(template) => settings.sports.includes(template.sport) || template.sport === "yoga",
						).map((template) => template.id),
					].map((id) => {
						const template = templateById(id);
						return (
							<Pressable
								key={id ?? "rest"}
								accessibilityRole="button"
								onPress={() => editing && setDay(editing, id)}
								style={styles.option}
							>
								<TrainingImage photo={template?.photo ?? null} size={40} radius={10} />
								<View style={styles.flex}>
									<PoText variant="row15">{template?.title ?? "Rest"}</PoText>
									<PoText variant="meta13" tone="textSecondary">
										{template
											? `${SPORT_LABELS[template.sport]} · ${template.short}`
											: "An easy day"}
									</PoText>
								</View>
							</Pressable>
						);
					})}
				</View>
			</Sheet>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	day: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 22,
		borderWidth: 1,
	},
	name: { width: 36 },
	bar: { width: 3, height: 32, borderRadius: 2 },
	next: { gap: 10, padding: 16, borderRadius: 24, borderWidth: 1, borderStyle: "dashed" },
	phase: { flexDirection: "row", gap: 16 },
	phaseItem: { flexDirection: "row", alignItems: "center", gap: 8 },
	hint: { paddingHorizontal: 6 },
	sheet: { gap: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
	option: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
});
