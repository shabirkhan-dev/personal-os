import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { useFinanceSummary } from "@/modules/finance";
import { clockOf, minutesOf } from "@/modules/home/lib/module-day";
import { toTextStyle, usePoTheme } from "@/theme";
import { closeDay, toggleTick } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { MINIMUM, minimumState, minimumTitle } from "../lib/daily-math";
import { Card, CardHead, CheckRow, MODULE_TONES } from "./daily-cards";
import { DailyScreen } from "./daily-screen";

const inputStyle = toTextStyle(textStyles.body15);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Close the day: the minimum day's result, every module's line, energy, one good thing, tomorrow. */
export function CloseScreen() {
	const { colors } = usePoTheme();
	const { data, sources, now, today, log, kept, total, streak } = useDailyToday();
	const finance = useFinanceSummary();
	const [energy, setEnergy] = useState<number | null>(log?.energy ?? null);
	const [good, setGood] = useState(log?.good ?? "");
	const [saving, setSaving] = useState(false);
	const all = total > 0 && kept >= total;
	const fajr = sources.faith ? sources.extra.faith.fajr : null;

	const close = () => {
		setSaving(true);
		closeDay(log, today, { energy, good, kept, total })
			.then(() => {
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[daily] could not close the day", error);
				setSaving(false);
			});
	};

	return (
		<DailyScreen>
			<ScreenTitle
				eyebrow={`${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} · ${clockOf(minutesOf(now))} · 2 minutes`}
				title="How did today go?"
			/>
			<Card tone={all ? "success" : undefined}>
				<View style={styles.result}>
					<PoText variant="display36" tone={all ? "textPrimary" : "textPrimary"}>
						{`${kept} of ${total}`}
					</PoText>
					<PoText variant="row15" tone={all ? "textSuccess" : "textSecondary"}>
						{all ? "minimum day kept" : "minimum day so far"}
					</PoText>
				</View>
				<PoText variant="meta13" tone={all ? "textSuccess" : "textSecondary"}>
					{all
						? `⚡ ${streak}-day streak · never miss twice`
						: "One miss is fine. Never miss twice: tomorrow's minimum day matters most."}
				</PoText>
			</Card>
			<Card>
				<CardHead title="Across your modules" />
				{data.settings.minimum.map((id) => {
					const state = minimumState(id, sources, log);
					const own = MINIMUM[id].module === "daily-life";
					return (
						<CheckRow
							key={id}
							label={minimumTitle(id, sources, data.settings)}
							value={state.done ? (state.value === "✓" ? "Done" : state.value) : state.value}
							done={state.done}
							tone={
								MODULE_TONES[MINIMUM[id].module] === "textPrimary"
									? "textSecondary"
									: MODULE_TONES[MINIMUM[id].module]
							}
							{...(own
								? {
										onPress: () =>
											void toggleTick(log, today, id).catch((error: unknown) =>
												console.error("[daily] could not save", error),
											),
									}
								: {})}
						/>
					);
				})}
				{sources.modules.includes("finance") ? (
					<CheckRow
						label="Spent"
						value={formatMoney(finance.spentToday).replace(/\.00$/, "")}
						done
						tone="textSuccess"
						valueTone="textSecondary"
					/>
				) : null}
			</Card>
			<Card>
				<PoText variant="eyebrow11" tone="textTertiary">
					Energy today
				</PoText>
				<View style={styles.energy}>
					{[1, 2, 3, 4, 5].map((value) => {
						const on = energy === value;
						return (
							<Pressable
								key={value}
								accessibilityRole="radio"
								accessibilityState={{ selected: on }}
								accessibilityLabel={`Energy ${value} of 5`}
								onPress={() => {
									haptics.select();
									setEnergy(value);
								}}
								style={[
									styles.score,
									on
										? { backgroundColor: colors.accentSubtle, borderColor: colors.accentDefault }
										: { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle },
								]}
							>
								<PoText variant="row15" tone={on ? "accentDefault" : "textTertiary"}>
									{value}
								</PoText>
							</Pressable>
						);
					})}
				</View>
				<PoText variant="eyebrow11" tone="textTertiary">
					One good thing
				</PoText>
				<TextInput
					value={good}
					onChangeText={(text) => setGood(text.slice(0, 200))}
					placeholder="Held a 25-second wall handstand"
					placeholderTextColor={colors.textTertiary}
					style={[
						inputStyle,
						styles.input,
						{ backgroundColor: colors.bgSubtle, color: colors.textPrimary },
					]}
				/>
			</Card>
			<Card>
				<PoText variant="eyebrow11" tone="textTertiary">
					Tomorrow starts with
				</PoText>
				<View style={styles.tomorrow}>
					<View style={[styles.bar, { backgroundColor: colors.textPrimary }]} />
					<View style={styles.flex}>
						<PoText variant="row15">
							{fajr
								? `Fajr at ${clockOf(fajr.minutes)}`
								: `Wake at ${clockOf(data.settings.wakeAt)}`}
						</PoText>
						<PoText variant="meta13" tone="textTertiary">
							{`${fajr && data.settings.alarms.fajr ? "Alarm on · " : ""}in bed by ${clockOf(data.settings.bedAt)}`}
						</PoText>
					</View>
				</View>
			</Card>
			<Footer>
				<PillButton
					label="Not now"
					variant="secondary"
					style={styles.flex}
					onPress={() => router.back()}
				/>
				<PillButton
					label={saving ? "Saving…" : "Close the day"}
					disabled={saving}
					style={styles.flex}
					onPress={close}
				/>
			</Footer>
		</DailyScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	result: { flexDirection: "row", alignItems: "baseline", gap: 10 },
	energy: { flexDirection: "row", gap: 6 },
	score: {
		flex: 1,
		height: 40,
		borderRadius: 12,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
	tomorrow: { flexDirection: "row", alignItems: "center", gap: 12 },
	bar: { width: 3, height: 32, borderRadius: 2 },
});
