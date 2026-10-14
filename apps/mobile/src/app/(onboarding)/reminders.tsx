import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { nextSetupRoute, onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { dayRhythm } from "@/modules/onboarding/lib/insights";
import type { ReminderId } from "@/modules/onboarding/lib/options";
import { requestReminderPermission } from "@/modules/onboarding/services/reminders.service";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

const goNext = () => router.push(nextSetupRoute(onboardingRoutes.reminders));

/** 14 Setup 7 · Voice & reminders */
export default function RemindersScreen() {
	const { colors } = usePoTheme();
	const state = useOnboardingStore();
	const rhythm = dayRhythm(state.wakeMinutes, state.bedMinutes);

	const [blocked, setBlocked] = useState(false);
	const [asking, setAsking] = useState(false);

	const rows = (
		[
			{ id: "morning-plan", title: "Morning plan", meta: `${rhythm.morningPlan} · after you wake` },
			{
				id: "evening-check-in",
				title: "Evening check-in",
				meta: `${rhythm.checkIn} · before sleep`,
			},
			state.modules.includes("workout")
				? { id: "workout-nudge", title: "Workout nudge", meta: "Mon, Wed, Fri · 18:30" }
				: null,
			state.modules.includes("finance")
				? { id: "bill-reminders", title: "Bill reminders", meta: "A day before each bill you add" }
				: null,
		] satisfies ({ id: ReminderId; title: string; meta: string } | null)[]
	).filter((row) => row !== null);
	const anyOn = rows.some((row) => state.reminders[row.id]);

	const notNow = () => {
		for (const row of rows) if (state.reminders[row.id]) state.toggleReminder(row.id);
		goNext();
	};

	const allow = async () => {
		if (!anyOn || blocked) {
			goNext();
			return;
		}
		setAsking(true);
		try {
			if (await requestReminderPermission()) goNext();
			else setBlocked(true);
		} catch (error) {
			console.error("Notification permission request failed", error);
			setBlocked(true);
		} finally {
			setAsking(false);
		}
	};

	return (
		<SetupFrame
			step={7}
			route={onboardingRoutes.reminders}
			title="Voice and reminders"
			body={["Small nudges at the right moment, timed to your day."]}
			gap={20}
			footer={
				<>
					{blocked ? (
						<PoText variant="meta13" tone="textSecondary" style={styles.note}>
							Notifications are off for Personal OS. Turn them on in Settings to get these.
						</PoText>
					) : null}
					<PillButton
						label={anyOn && !blocked ? "Allow and continue" : "Continue"}
						disabled={asking}
						onPress={() => void allow()}
					/>
					<PillButton variant="ghost" label="Not now" onPress={notNow} />
				</>
			}
		>
			<View
				style={[styles.hey, { backgroundColor: colors.bgHover, borderColor: colors.borderDefault }]}
			>
				<View style={[styles.tile56, { backgroundColor: colors.statusVioletSubtle }]}>
					<Icon name="Mic" color={colors.statusViolet} />
				</View>
				<View style={styles.text}>
					<PoText variant="title18">Say “Hey OS”</PoText>
					<PoText variant="meta13" tone="textSecondary">
						Talk to it with the app closed
					</PoText>
				</View>
				<View style={[styles.soon, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="eyebrow11" tone="textSecondary">
						Soon
					</PoText>
				</View>
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
	soon: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
	note: { textAlign: "center" },
	gap12: { height: 12 },
	list: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 28, borderWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
});
