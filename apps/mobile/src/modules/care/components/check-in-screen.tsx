import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { toTextStyle, usePoTheme } from "@/theme";
import { saveCheckIn } from "../data/care-actions";
import { useCareToday } from "../hooks/use-care";
import { metricsFor, ratingWord, weekdayName } from "../lib/care-math";
import { METRIC_LABELS, type Metric } from "../lib/care-model";
import { Banner, Card } from "./home-cards";
import { CareScreen } from "./care-screen";

const noteStyle = toTextStyle(textStyles.meta13);

/** The weekly mirror check: a 1–5 rating and a few words per thing being worked on. No photos. */
export function CheckInScreen() {
	const { colors } = usePoTheme();
	const { data, today, now } = useCareToday();
	const metrics = metricsFor(data.settings);
	const existing = data.checkIns.find((item) => item.id === today);
	const [ratings, setRatings] = useState<Partial<Record<Metric, number>>>(existing?.ratings ?? {});
	const [notes, setNotes] = useState<Partial<Record<Metric, string>>>(existing?.notes ?? {});
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const save = () => {
		if (Object.keys(ratings).length === 0) {
			setNotice("Rate at least one thing, or skip this week.");
			return;
		}
		setSaving(true);
		saveCheckIn({ id: today, ratings, notes })
			.then(() => {
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[care] could not save the check-in", error);
				setNotice("Couldn't save on this phone. Try again.");
				setSaving(false);
			});
	};

	return (
		<CareScreen>
			<ScreenTitle
				eyebrow={`${weekdayName(now.getDay())} · 2 minutes · no photos`}
				title="How's it looking?"
			/>
			<Banner tone="accent">
				Rate what you notice in the mirror: 1 is fine, 5 is bad. Your words and numbers track
				progress, and nothing is photographed or stored as an image.
			</Banner>
			<Card>
				{metrics.map((metric) => {
					const value = ratings[metric];
					const word = value ? ratingWord(value) : null;
					return (
						<View key={metric} style={styles.metric}>
							<View style={styles.head}>
								<PoText variant="row15" style={styles.flex}>
									{METRIC_LABELS[metric]}
								</PoText>
								{word ? (
									<PoText variant="meta13" tone={word.tone}>
										{word.word}
									</PoText>
								) : null}
							</View>
							<View style={styles.scale}>
								{[1, 2, 3, 4, 5].map((score) => {
									const on = value === score;
									const tone = ratingWord(score).tone;
									const bg =
										tone === "textSuccess"
											? colors.statusSuccessSubtle
											: tone === "textLink"
												? colors.accentSubtle
												: colors.statusWarningSubtle;
									return (
										<Pressable
											key={score}
											accessibilityRole="radio"
											accessibilityState={{ selected: on }}
											accessibilityLabel={`${METRIC_LABELS[metric]} ${score} of 5`}
											onPress={() => {
												haptics.select();
												setRatings((current) => ({ ...current, [metric]: score }));
											}}
											style={[
												styles.score,
												on
													? { backgroundColor: bg, borderColor: colors[tone] }
													: { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle },
											]}
										>
											<PoText variant="row15" tone={on ? tone : "textTertiary"}>
												{score}
											</PoText>
										</Pressable>
									);
								})}
							</View>
							<TextInput
								value={notes[metric] ?? ""}
								onChangeText={(text) =>
									setNotes((current) => ({ ...current, [metric]: text.slice(0, 80) }))
								}
								placeholder="A few words (optional)"
								placeholderTextColor={colors.textTertiary}
								style={[noteStyle, styles.note, { color: colors.textSecondary }]}
							/>
						</View>
					);
				})}
			</Card>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Skip this week"
					variant="secondary"
					style={styles.flex}
					onPress={() => router.back()}
				/>
				<PillButton
					label={saving ? "Saving…" : "Save check-in"}
					disabled={saving}
					style={styles.flex}
					onPress={save}
				/>
			</Footer>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	metric: { gap: 10, paddingVertical: 6 },
	head: { flexDirection: "row", alignItems: "center" },
	scale: { flexDirection: "row", gap: 6 },
	score: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	note: { paddingVertical: 2 },
});
