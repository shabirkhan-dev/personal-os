import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { ActionPills, FilterChip, ReadError, ResultCard } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { addWater, deleteMeal, logRecipe, saveSettings, weighIn } from "../data/food-actions";
import { draftFromText, FOOD_ASK_JOB, useFoodUi } from "../hooks/food-ui-store";
import { bodyLine, useBody } from "../hooks/use-body";
import { useFoodToday } from "../hooks/use-food";
import { itemsLine, nextSlot, pickRecipe, slotRows } from "../lib/food-math";
import { GOAL_LABELS, type Goal, SLOT_LABELS, SLOT_TIMES } from "../lib/food-model";
import { parseFoodLine } from "../lib/parse-meal";
import { RECIPES } from "../lib/recipes";
import { goalWeight, remaining, targetsFor } from "../lib/targets";
import { foodRoutes } from "../navigation";
import { foodAiMessage, useFoodAi } from "../services/food-ai";
import { mealPhoto } from "../services/meal-photo";
import {
	FirstMealCard,
	FoodAnswerCard,
	GoalCard,
	kcalText,
	MacrosCard,
	MealsCard,
	WaterCard,
	WeightCard,
} from "./home-cards";

const ASK_STEPS = ["Reading today's meals", "Checking your targets", "Picking what fits"] as const;
const GLASS_ML = 250;

type Logged = { quote: string; title: string; subtitle: string; value: string; undo: () => void };

/** Food Home: ask bar, macros, weight, water and today's five meals; the goal picker when new. */
export function FoodHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, now, today, eaten, waterMl, trend, planToday } = useFoodToday();
	const { settings, meals } = data;
	const body = useBody();
	const ui = useFoodUi();
	const ai = useFoodAi();
	const askJob = useAiJobs((state) => state.jobs[FOOD_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [notice, setNotice] = useState<string | null>(null);
	const [logged, setLogged] = useState<Logged | null>(null);
	const [goal, setGoal] = useState<Goal>("lean-bulk");
	const [saving, setSaving] = useState(false);
	const [weighing, setWeighing] = useState(false);
	const [kg, setKg] = useState("");
	const [waterSheet, setWaterSheet] = useState(false);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[food] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const photo = async () => {
		const result = await mealPhoto("camera");
		if (result.status === "denied") setNotice("Allow the camera in Settings to snap a meal.");
		if (result.status === "error") setNotice("The camera didn't open. Try again.");
		if (result.status !== "ok") return;
		ui.setDraft({
			text: "",
			items: [],
			unmatched: [],
			slot: null,
			photo: result.uri,
			source: "photo",
		});
		foodRoutes.log();
	};

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		void photo();
		// oxlint-disable-next-line react/exhaustive-deps -- runs when the header button is pressed
	}, [actionRequest]);

	const rows = useMemo(
		() => slotRows(meals, today, planToday, SLOT_TIMES),
		[meals, today, planToday],
	);
	const preview = useMemo(() => targetsFor(body, goal, "active"), [body, goal]);

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};

	const drink = (ml: number, quote: string, spoken = false) => {
		const before = waterMl;
		addWater(before, ml)
			.then((next) => {
				haptics.success();
				setNotice(null);
				setLogged({
					quote,
					title: ml >= 0 ? `Water +${ml} ml` : `Water ${ml} ml`,
					subtitle: `${(next / 1000).toFixed(2).replace(/0$/, "")} L today`,
					value: "Logged",
					undo: () => void addWater(next, before - next).catch(failed("undo water")),
				});
				if (spoken) voiceOut.speak(`Logged ${ml} millilitres of water.`);
			})
			.catch(failed("log water"));
	};

	const ask = (question: string, spoken: boolean) => {
		const left = remaining(settings.targets, eaten);
		if (!ai.available) {
			const slot = nextSlot(now.getHours() * 60 + now.getMinutes(), SLOT_TIMES);
			const recipe = pickRecipe(slot, left);
			say(
				recipe
					? `Offline pick for ${SLOT_LABELS[slot].toLowerCase()}: ${recipe.name}, ${recipe.protein} g protein for ${recipe.kcal} kcal. You have ${Math.round(left.protein)} g protein left.`
					: `You have ${kcalText(left.kcal)} kcal and ${Math.round(left.protein)} g protein left today.`,
				spoken,
			);
			return;
		}
		setNotice(null);
		ui.setAnswer(null);
		startJob(FOOD_ASK_JOB, "Thinking about what to eat", async () => {
			try {
				const answer = await ai.ask({
					question,
					goal: GOAL_LABELS[settings.goal],
					targets: settings.targets,
					eaten,
					meals: rows
						.filter((row) => row.meals.length > 0)
						.map((row) => ({ slot: row.slot, names: row.title })),
					recipes: RECIPES.map((recipe) => ({ id: recipe.id, name: recipe.name })),
				});
				useFoodUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(foodAiMessage(error), { cause: error });
			}
		});
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseFoodLine(text);
		if (!intent) return;
		if (intent.kind === "water") {
			drink(intent.ml, text, spoken);
			return;
		}
		if (intent.kind === "weight") {
			const previous = data.weighIns.find((item) => item.id === today) ?? null;
			weighIn(intent.kg)
				.then(() => {
					haptics.success();
					setLogged({
						quote: text,
						title: `Weight ${intent.kg.toFixed(1)} kg`,
						subtitle: "Today's weigh-in",
						value: "Saved",
						undo: () =>
							void (previous ? weighIn(previous.kg) : Promise.resolve()).catch(failed("undo")),
					});
					if (spoken) voiceOut.speak(`Saved ${intent.kg} kilos.`);
				})
				.catch(failed("save the weight"));
			return;
		}
		if (intent.kind === "open") {
			foodRoutes[intent.screen]();
			return;
		}
		if (intent.kind === "meal") {
			ui.setDraft(draftFromText(intent.text, spoken ? "voice" : "text"));
			foodRoutes.log();
			return;
		}
		ask(intent.text, spoken);
	};

	// A line said on Talk to OS lands here once the log has loaded.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "food") return;
		const line = useAskInbox.getState().take("food");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const start = () => {
		setSaving(true);
		saveSettings({
			...settings,
			setUp: true,
			goal,
			activity: "active",
			targets: preview,
			startKg: trend.latest === settings.startKg ? body.weightKg : trend.latest,
			goalKg: goalWeight(goal, body.weightKg),
			startedOn: dayKey(now),
		})
			.then(() => haptics.success())
			.catch(failed("save the goal"))
			.finally(() => setSaving(false));
	};

	const saveWeight = () => {
		const value = Number(kg.replace(",", "."));
		if (!Number.isFinite(value) || value < 25 || value > 300) {
			setNotice("Type your weight in kg, like 65.4.");
			return;
		}
		setWeighing(false);
		setKg("");
		weighIn(value)
			.then(() => haptics.success())
			.catch(failed("save the weight"));
	};

	const setUp = settings.setUp;

	if (data.error) return <ReadError name="Food" />;

	return (
		<>
			{setUp ? null : (
				<GoalCard
					goal={goal}
					onGoal={setGoal}
					targets={preview}
					from={bodyLine(body, "active")}
					busy={saving}
					onStart={start}
				/>
			)}
			<View style={styles.ask}>
				<AskBar suggestions={[]} placeholder="Log a meal or ask what to eat…" onSubmit={onLine} />
				<ActionPills
					actions={[
						{ label: "Photo", icon: "Filled/Camera", onPress: () => void photo() },
						{
							label: "Say it",
							icon: "Mic",
							onPress: () => {
								ui.setDraft(null);
								foodRoutes.log();
							},
						},
						{ label: "Barcode", icon: "Filled/Scan", onPress: foodRoutes.scan },
					]}
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{logged ? (
				<ResultCard
					quote={logged.quote}
					offline={!ai.available}
					rows={[{ title: logged.title, subtitle: logged.subtitle, value: logged.value }]}
					onUndo={() => {
						logged.undo();
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(FOOD_ASK_JOB)}
					onDismiss={() => dismissJob(FOOD_ASK_JOB)}
				/>
			) : ui.answer ? (
				<FoodAnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					recipeId={ui.answer.recipeId}
					followUps={ui.answer.followUps}
					onRecipe={foodRoutes.recipe}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}

			{setUp ? (
				<>
					<MacrosCard eaten={eaten} targets={settings.targets} />
					<WeightCard
						goal={settings.goal}
						trend={trend}
						startKg={settings.startKg}
						goalKg={settings.goalKg}
						weighInDay={settings.weighInDay}
						onPress={() => {
							setKg(trend.latest.toFixed(1));
							setWeighing(true);
						}}
					/>
					<WaterCard
						ml={waterMl}
						targetMl={settings.targets.waterMl}
						onAdd={() => drink(GLASS_ML, "+ a glass of water")}
						onLongAdd={() => setWaterSheet(true)}
					/>
					<MealsCard
						rows={rows}
						onRow={(row) => {
							if (row.meals.length === 0 && row.planned) {
								foodRoutes.recipe(row.planned.recipeId);
								return;
							}
							ui.setDraft({
								text: "",
								items: row.meals.flatMap((meal) => meal.items),
								unmatched: [],
								slot: row.slot,
								photo: row.photo,
								source: "text",
								replace: row.meals,
							});
							foodRoutes.log();
						}}
						onLog={(row) => {
							const planned = row.planned;
							if (!planned) return;
							logRecipe(planned.recipeId, row.slot, planned.portions)
								.then((meal) => {
									haptics.success();
									setLogged({
										quote: `Log ${SLOT_LABELS[row.slot].toLowerCase()}`,
										title: SLOT_LABELS[row.slot],
										subtitle: itemsLine(meal.items),
										value: `${kcalText(row.kcal)} kcal`,
										undo: () => void deleteMeal(meal).catch(failed("undo")),
									});
								})
								.catch(failed("log the meal"));
						}}
					/>
					<View style={styles.links}>
						<FilterChip label="Meal plan" selected={false} onPress={foodRoutes.plan} />
						<FilterChip label="Grocery list" selected={false} onPress={foodRoutes.grocery} />
						<FilterChip label="Recipes" selected={false} onPress={foodRoutes.recipes} />
					</View>
				</>
			) : (
				<FirstMealCard />
			)}

			<Sheet
				visible={weighing}
				title="Weigh in"
				onClose={() => setWeighing(false)}
				action={{ label: "Save", onPress: saveWeight }}
			>
				<TextField
					label="Weight"
					value={kg}
					onChangeText={setKg}
					keyboardType="decimal-pad"
					suffix="kg"
					onSubmitEditing={saveWeight}
				/>
				<PoText variant="meta13" tone="textSecondary">
					Same time each week, ideally in the morning before breakfast.
				</PoText>
			</Sheet>
			<Sheet visible={waterSheet} title="Water" onClose={() => setWaterSheet(false)}>
				<View style={styles.links}>
					{[250, 500, 750, 1000].map((ml) => (
						<FilterChip
							key={ml}
							label={`+${ml} ml`}
							selected={false}
							onPress={() => {
								setWaterSheet(false);
								drink(ml, `+ ${ml} ml water`);
							}}
						/>
					))}
					{waterMl > 0 ? (
						<FilterChip
							label="−250 ml"
							selected={false}
							onPress={() => {
								setWaterSheet(false);
								drink(-Math.min(GLASS_ML, waterMl), "− a glass of water");
							}}
						/>
					) : null}
				</View>
			</Sheet>
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
	links: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
