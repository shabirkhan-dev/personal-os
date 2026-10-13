import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AiInsight } from "@/modules/onboarding/components/ai-insight";
import { FieldLabel } from "@/modules/onboarding/components/field-label";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { StepperCard } from "@/modules/onboarding/components/stepper-card";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { dayRhythm } from "@/modules/onboarding/lib/insights";
import type { WorkStyle } from "@/modules/onboarding/lib/options";
import { formatClock, wrapMinutes } from "@/modules/onboarding/lib/time";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

const STEP_MINUTES = 15;
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Common office hours; tapping the field cycles through them. */
const WORK_HOURS: readonly [number, number][] = [
	[9 * 60, 18 * 60],
	[8 * 60, 17 * 60],
	[10 * 60, 19 * 60],
	[9 * 60, 17 * 60],
];

const workStyles = [
	{ value: "office", label: "Office" },
	{ value: "remote", label: "Remote" },
	{ value: "hybrid", label: "Hybrid" },
] as const satisfies readonly { value: WorkStyle; label: string }[];

/** 10 Setup 3 · Your day */
export default function YourDayScreen() {
	const { colors } = usePoTheme();
	const state = useOnboardingStore();
	const rhythm = dayRhythm(state.wakeMinutes, state.bedMinutes);
	const workdayCount = state.workdays.filter(Boolean).length;

	const cycleWorkHours = () => {
		const current = WORK_HOURS.findIndex(
			([start, end]) => start === state.workStartMinutes && end === state.workEndMinutes,
		);
		const [start, end] = WORK_HOURS[(current + 1) % WORK_HOURS.length];
		state.set("workStartMinutes", start);
		state.set("workEndMinutes", end);
	};

	return (
		<SetupFrame
			step={3}
			route={onboardingRoutes.yourDay}
			title="How does your day run?"
			body={["Upcoming and reminders follow this rhythm."]}
		>
			<View style={styles.form}>
				<View style={styles.times}>
					<StepperCard
						label="Wake up"
						value={formatClock(state.wakeMinutes)}
						icon="Sun"
						iconTone="statusCaution"
						tileTone="statusCautionSubtle"
						stepLabel={`${STEP_MINUTES} min`}
						onDecrement={() =>
							state.set("wakeMinutes", wrapMinutes(state.wakeMinutes - STEP_MINUTES))
						}
						onIncrement={() =>
							state.set("wakeMinutes", wrapMinutes(state.wakeMinutes + STEP_MINUTES))
						}
					/>
					<StepperCard
						label="Sleep"
						value={formatClock(state.bedMinutes)}
						icon="Moon"
						iconTone="statusViolet"
						tileTone="statusVioletSubtle"
						stepLabel={`${STEP_MINUTES} min`}
						onDecrement={() =>
							state.set("bedMinutes", wrapMinutes(state.bedMinutes - STEP_MINUTES))
						}
						onIncrement={() =>
							state.set("bedMinutes", wrapMinutes(state.bedMinutes + STEP_MINUTES))
						}
					/>
				</View>
				<View style={styles.group}>
					<FieldLabel label="Work hours" />
					<Pressable
						accessibilityRole="button"
						accessibilityHint="Changes your work hours"
						onPress={() => {
							haptics.select();
							cycleWorkHours();
						}}
						style={({ pressed }) => [
							styles.field,
							{
								backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
								borderColor: colors.borderDefault,
							},
						]}
					>
						<PoText variant="row15" style={styles.flex}>
							{`${formatClock(state.workStartMinutes)} – ${formatClock(state.workEndMinutes)}`}
						</PoText>
						<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
					</Pressable>
				</View>
				<View style={styles.group}>
					<FieldLabel label="Workdays" value={`${workdayCount} days`} />
					<View style={styles.days}>
						{DAY_LETTERS.map((letter, index) => {
							const on = state.workdays[index];
							return (
								<Pressable
									key={DAY_NAMES[index]}
									accessibilityRole="checkbox"
									accessibilityLabel={DAY_NAMES[index]}
									accessibilityState={{ checked: on }}
									onPress={() => {
										haptics.select();
										state.toggleWorkday(index);
									}}
									style={[
										styles.day,
										on
											? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
											: { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
									]}
								>
									<PoText variant="row15" tone={on ? "textOnAccent" : "textSecondary"}>
										{letter}
									</PoText>
								</Pressable>
							);
						})}
					</View>
				</View>
				<View style={styles.group}>
					<FieldLabel label="Work style" />
					<SegmentedControl
						options={workStyles}
						value={state.workStyle}
						onChange={(value) => state.set("workStyle", value)}
						accessibilityLabel="Work style"
					/>
				</View>
			</View>
			<View style={styles.gap14} />
			<AiInsight
				parts={[
					[`${rhythm.sleep} of sleep`],
					". Morning plan at ",
					[rhythm.morningPlan],
					", check-in at ",
					[rhythm.checkIn],
					".",
				]}
			/>
		</SetupFrame>
	);
}

const styles = StyleSheet.create({
	form: { gap: 16 },
	times: { flexDirection: "row", gap: 10 },
	group: { gap: 8 },
	flex: { flex: 1 },
	field: {
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		borderRadius: 28,
		borderWidth: 1,
	},
	days: { flexDirection: "row", justifyContent: "space-between" },
	day: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	gap14: { height: 14 },
});
