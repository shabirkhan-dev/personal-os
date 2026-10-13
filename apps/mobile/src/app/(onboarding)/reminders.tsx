import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { nextSetupRoute, onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { dayRhythm } from "@/modules/onboarding/lib/insights";
import type { ReminderId } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

const goNext = () => router.push(nextSetupRoute(onboardingRoutes.reminders));

/** 14 Setup 7 · Voice & reminders */
export default function RemindersScreen() {
	const { colors } = usePoTheme();
	const state = useOnboardingStore();
	const rhythm = dayRhythm(state.wakeMinutes, state.bedMinutes);

	const rows: readonly { id: ReminderId; title: string; meta: string }[] = [
		{ id: "morning-plan", title: "Morning plan", meta: `${rhythm.morningPlan} · after you wake` },
		{ id: "evening-check-in", title: "Evening check-in", meta: `${rhythm.checkIn} · before sleep` },
		{ id: "workout-nudge", title: "Workout nudge", meta: "Mon, Wed, Fri · 18:30" },
		{ id: "bill-reminders", title: "Bill reminders", meta: "One day before it's due" },
	];

	const notNow = () => {
		state.set("heyOs", false);
		for (const row of rows) if (state.reminders[row.id]) state.toggleReminder(row.id);
		goNext();
	};

	return (
		<SetupFrame
			step={7}
			route={onboardingRoutes.reminders}
			title="Voice and reminders"
			body={["Talk to Personal OS anytime, and get small nudges at the right moment."]}
			gap={20}
			footer={
				<>
					<PillButton label="Allow and continue" onPress={goNext} />
					<PillButton variant="ghost" label="Not now" onPress={notNow} />
				</>
			}
		>
			<View
				style={[
					styles.hey,
					{
						backgroundColor: colors.bgHover,
						borderColor: state.heyOs ? colors.textSecondary : colors.borderDefault,
					},
				]}
			>
				<View style={[styles.tile56, { backgroundColor: colors.statusVioletSubtle }]}>
					<Icon name="Mic" color={colors.statusViolet} />
				</View>
				<View style={styles.text}>
					<PoText variant="title18">Say “Hey OS”</PoText>
					<PoText variant="meta13" tone="textSecondary">
						Works with the app closed
					</PoText>
				</View>
				<Toggle
					value={state.heyOs}
					onChange={(value) => state.set("heyOs", value)}
					accessibilityLabel="Hey OS"
				/>
			</View>
			<View style={styles.gap12} />
			<View
				style={[
					styles.list,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{rows.map((row, index) => (
					<View
						key={row.id}
						style={[
							styles.row,
							index < rows.length - 1
								? { borderBottomWidth: 1, borderBottomColor: colors.borderDefault }
								: null,
						]}
					>
						<View style={styles.text}>
							<PoText variant="row15">{row.title}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{row.meta}
							</PoText>
						</View>
						<Toggle
							value={state.reminders[row.id]}
							onChange={() => state.toggleReminder(row.id)}
							accessibilityLabel={row.title}
						/>
					</View>
				))}
			</View>
		</SetupFrame>
	);
}

const styles = StyleSheet.create({
	hey: {
		height: 72,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 16,
		borderRadius: 36,
		borderWidth: 1.5,
	},
	tile56: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	text: { flex: 1, gap: 2 },
	gap12: { height: 12 },
	list: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 28, borderWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
});
