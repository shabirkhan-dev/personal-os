import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { AskBar } from "@/modules/home/components/ask-bar";
import { saveDay } from "../data/care-actions";
import { CARE_ASK_JOB, useCareUi } from "../hooks/care-ui-store";
import { useCareToday } from "../hooks/use-care";
import { emptyDay, ratingWord, trend } from "../lib/care-math";
import { CONCERN_LABELS, type Metric, type Step } from "../lib/care-model";
import { careAiMessage, useCareAi } from "../services/care-ai";
import { Card, CardHead, CareAnswerCard } from "./home-cards";
import { CareScreen } from "./care-screen";
import { ProductImage } from "./product-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const daysLabel = (step: Step) =>
	step.days.length === 0 ? "Daily" : step.days.map((day) => WEEKDAYS[day]).join(" · ");

const barTone = (value: number) =>
	value <= 2 ? "statusSuccess" : value === 3 ? "accentDefault" : "statusCaution";

const EYE: readonly { metric: Metric; label: string }[] = [
	{ metric: "hair-fall", label: "Hair fall" },
	{ metric: "greys", label: "Greys" },
];

/** Hair and scalp: the week's hair steps, flakes over time and what to keep an eye on. */
export function HairScreen() {
	const { colors } = usePoTheme();
	const { data, today, record } = useCareToday();
	const { settings, steps, products, checkIns } = data;
	const ai = useCareAi();
	const ui = useCareUi();
	const askJob = useAiJobs((state) => state.jobs[CARE_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [asking, setAsking] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const hair = steps.filter((step) => step.area === "hair");
	const flakes = trend(checkIns, "dandruff", 8);
	const latest = checkIns.at(-1) ?? null;
	const first = flakes[0];
	const last = flakes.at(-1);
	const concerns = settings.concerns.filter(
		(item) => item === "dandruff" || item === "hair-density" || item === "early-greys",
	);
	const wash = hair.find((step) => /wash|shampoo/i.test(step.name));

	const ask = (question: string) => {
		if (!ai.available) {
			setNotice("Questions need a connection and sign-in.");
			return;
		}
		ui.setAnswer(null);
		startJob(CARE_ASK_JOB, "Thinking about your hair", async () => {
			try {
				const answer = await ai.ask({
					question,
					concerns: settings.concerns,
					skin: settings.skin,
					routine: steps.map((step) => ({ routine: step.routine, name: step.name })),
					ratings: (latest?.ratings ?? {}) as Record<string, number>,
					uv: null,
				});
				useCareUi.getState().setAnswer({ ...answer, question });
			} catch (error) {
				throw new Error(careAiMessage(error), { cause: error });
			}
		});
	};

	const logWash = () => {
		if (!wash) {
			setNotice("Add a hair wash step to your morning routine first.");
			return;
		}
		const base = record ?? emptyDay(today);
		saveDay({
			...base,
			steps: { ...base.steps, [wash.id]: base.steps[wash.id] ?? new Date().toISOString() },
		})
			.then(() => {
				haptics.success();
				setNotice("Wash day logged.");
			})
			.catch((error: unknown) => {
				console.error("[care] could not log the wash", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<CareScreen>
			<ScreenTitle
				eyebrow={
					concerns.length
						? concerns.map((item) => CONCERN_LABELS[item]).join(" · ")
						: "Hair and scalp"
				}
				title="Hair and scalp"
			/>
			<Card>
				<CardHead
					title="Weekly plan"
					right={`${hair.length} thing${hair.length === 1 ? "" : "s"}`}
				/>
				{hair.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary">
						No hair steps yet. Pick dandruff, density or greys on Care's setup, or add a step to a
						routine.
					</PoText>
				) : null}
				{hair.map((step) => (
					<View key={step.id} style={styles.plan}>
						<ProductImage
							photo={products.find((product) => product.id === step.productId)?.photo ?? null}
							size={48}
							radius={12}
						/>
						<View style={styles.flex}>
							<PoText variant="row15">{step.name}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{step.detail}
							</PoText>
						</View>
						<PoText variant="mono13" tone="accentDefault">
							{daysLabel(step)}
						</PoText>
					</View>
				))}
			</Card>

			<Card>
				<CardHead
					title="Flakes, your rating"
					right={`last ${Math.max(flakes.length, 1)} week${flakes.length === 1 ? "" : "s"}`}
				/>
				{flakes.length === 0 ? (
					<PoText variant="meta13" tone="textSecondary">
						Rate dandruff in the weekly check-in and the trend shows here.
					</PoText>
				) : (
					<>
						<View style={styles.chart}>
							{flakes.map((point, index) => (
								<View key={point.day} style={styles.barColumn}>
									<View style={styles.barTrack}>
										<View
											style={[
												styles.bar,
												{
													height: `${(point.value / 5) * 100}%`,
													backgroundColor: colors[barTone(point.value)],
												},
											]}
										/>
									</View>
									<PoText variant="mono13" tone="textTertiary">
										{`W${index + 1}`}
									</PoText>
								</View>
							))}
						</View>
						{first && last && flakes.length > 1 ? (
							<PoText
								variant="meta13"
								tone={
									last.value < first.value
										? "textSuccess"
										: last.value > first.value
											? "textWarning"
											: "textSecondary"
								}
							>
								{last.value < first.value
									? `Down from ${first.value} to ${last.value}${wash ? ` since ${daysLabel(wash).toLowerCase()} washes` : ""}`
									: last.value > first.value
										? `Up from ${first.value} to ${last.value}. Keep the washes regular.`
										: `Steady at ${last.value}.`}
							</PoText>
						) : null}
					</>
				)}
			</Card>

			<Card>
				<CardHead title="Keep an eye on" />
				{EYE.map((row) => {
					const value = latest?.ratings[row.metric];
					const rating = value ? ratingWord(value) : null;
					return (
						<View key={row.metric} style={styles.eye}>
							<PoText variant="meta13" tone="textSecondary">
								{row.label}
							</PoText>
							<PoText variant="meta13" tone={rating?.tone ?? "textTertiary"}>
								{latest?.notes[row.metric] ?? rating?.word ?? "Not rated yet"}
							</PoText>
						</View>
					);
				})}
				<View style={styles.eye}>
					<PoText variant="meta13" tone="textSecondary">
						Density
					</PoText>
					<PoText variant="meta13">Monthly check in good light</PoText>
				</View>
				<PoText variant="meta13" tone="textLink">
					If thinning speeds up or comes out in patches, a dermatologist visit is the next step.
				</PoText>
			</Card>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			{asking ? (
				<AskBar
					suggestions={[]}
					placeholder="Ask about your hair or scalp…"
					onSubmit={(text) => ask(text)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={["Reading your hair plan", "Checking your ratings", "Writing an answer"]}
					onRetry={() => retryJob(CARE_ASK_JOB)}
					onDismiss={() => dismissJob(CARE_ASK_JOB)}
				/>
			) : ui.answer ? (
				<CareAnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					onFollowUp={ask}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}
			<Footer>
				<PillButton
					label="Ask a question"
					variant="secondary"
					style={styles.flex}
					onPress={() => setAsking((value) => !value)}
				/>
				<PillButton label="Log wash day" style={styles.flex} onPress={logWash} />
			</Footer>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	plan: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	chart: { flexDirection: "row", gap: 8, height: 110 },
	barColumn: { flex: 1, alignItems: "center", gap: 6 },
	barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
	bar: { width: "100%", borderRadius: 8, minHeight: 8 },
	eye: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
});
