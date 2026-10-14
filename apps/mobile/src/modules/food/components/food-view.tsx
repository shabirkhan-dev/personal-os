import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useFoodDay } from "../hooks/use-food-day";
import { openRecipe, openRecipes } from "../navigation";
import { dinnerIdeaText, type IdeaPart } from "../lib/idea";
import { rankRecipes } from "../lib/match";
import { type Meal, type MealSlot, slotForTime, type SlotSummary } from "../lib/meals";
import { parseFoodText } from "../lib/parse-log";
import { RECIPES, type Recipe, recipeById } from "../lib/recipes";
import { chooseMealPhoto, type PhotoResult, takeMealPhoto } from "../services/meal-photo";
import { foodActions } from "../store/food-store";
import { DinnerIdeaCard, type DinnerIdeaCardProps } from "./dinner-idea-card";
import { LogMealSheet, type MealDraft, nextDraftKey } from "./log-meal-sheet";
import { MacrosCard } from "./macros-card";
import { MealsCard } from "./meals-card";
import { QuickLog } from "./quick-log";
import { SayItSheet } from "./say-it-sheet";
import { WaterCard } from "./water-card";
import { WaterSheet } from "./water-sheet";

const SHEET_HANDOFF_MS = 350;
const PHOTO_NOTE = "Type the calories for now; estimates from photos come later.";

function plannedFrom(recipe: Recipe, day: string, id = newId()): Meal {
	return {
		id,
		dayKey: day,
		slot: "dinner",
		name: recipe.name,
		kcal: recipe.kcal,
		protein: recipe.protein,
		carbs: recipe.carbs,
		fat: recipe.fat,
		at: new Date().toISOString(),
		planned: true,
		recipeId: recipe.id,
	};
}

/** A meal typed into the ask bar, eaten now. */
function eatenNow(
	parsed: { name: string; kcal: number; protein?: number },
	day: string,
	slot: MealSlot,
): Meal {
	const meal: Meal = {
		id: newId(),
		dayKey: day,
		slot,
		name: parsed.name,
		kcal: parsed.kcal,
		at: new Date().toISOString(),
	};
	if (parsed.protein !== undefined) meal.protein = parsed.protein;
	return meal;
}

function draftFromMeal(meal: Meal): MealDraft {
	return {
		slot: meal.slot,
		name: meal.name,
		kcal: meal.kcal,
		protein: meal.protein,
		carbs: meal.carbs,
		fat: meal.fat,
		photoUri: meal.photoUri,
		recipeId: meal.recipeId,
		mealId: meal.id,
	};
}

/** Food module Home (Figma 177:1166): macros, water, today's meals, dinner idea, quick log. */
export function FoodView({ actionRequest }: HomeModuleViewProps) {
	const day = useFoodDay();
	const [draft, setDraft] = useState<{ key: number; value: MealDraft } | null>(null);
	const [waterOpen, setWaterOpen] = useState(false);
	const [voiceOpen, setVoiceOpen] = useState(false);
	const [ideaOffset, setIdeaOffset] = useState(0);

	const openDraft = (value: MealDraft) => setDraft({ key: nextDraftKey(), value });
	const currentSlot = slotForTime(day.now);

	const handlePhoto = (result: PhotoResult, retry: { label: string; run: () => void }) => {
		if (result.status === "ok") {
			openDraft({ slot: currentSlot, photoUri: result.uri, note: PHOTO_NOTE });
		} else if (result.status === "denied") {
			Alert.alert("Photo access is off", "Allow access in Settings to log meals with a photo.", [
				{ text: "Not now", style: "cancel" },
				{
					text: "Open Settings",
					onPress: () => {
						Linking.openSettings().catch((error: unknown) =>
							console.error("Could not open settings", error),
						);
					},
				},
			]);
		} else if (result.status === "error") {
			Alert.alert("Couldn't get a photo", "You can try again or log the meal without one.", [
				{ text: "Log without photo", onPress: () => openDraft({ slot: currentSlot }) },
				{ text: retry.label, onPress: retry.run },
			]);
		}
	};

	const photoFromLibrary = () => {
		chooseMealPhoto()
			.then((result) => handlePhoto(result, { label: "Try again", run: photoFromLibrary }))
			.catch((error: unknown) => console.error("Meal photo failed", error));
	};
	const photo = () => {
		takeMealPhoto()
			.then((result) =>
				handlePhoto(result, { label: "Choose from library", run: photoFromLibrary }),
			)
			.catch((error: unknown) => console.error("Meal photo failed", error));
	};

	// The header's camera button.
	const seenRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === seenRequest.current) return;
		seenRequest.current = actionRequest;
		photo();
	});

	const submit = (text: string) => {
		const parsed = parseFoodText(text);
		if (!parsed) return;
		if (parsed.kind === "water") {
			foodActions.addWater(day.today, parsed.ml);
			haptics.success();
			return;
		}
		if (parsed.kind === "meal") {
			foodActions.logMeal(eatenNow(parsed, day.today, parsed.slot ?? currentSlot));
			haptics.success();
			return;
		}
		openDraft({ slot: parsed.slot ?? currentSlot, name: parsed.name, kcal: parsed.kcal });
	};

	const onLog = (summary: SlotSummary, planned: Meal | null) =>
		openDraft(planned ? draftFromMeal(planned) : { slot: summary.slot });

	const ranked = useMemo(() => rankRecipes(RECIPES, day.left, "dinner"), [day.left]);
	const dinner = day.slots[3];
	const idea = ideaFor({
		dinner,
		ranked,
		offset: ideaOffset,
		left: day.left,
		targetKcal: day.targets.kcal,
		today: day.today,
		onSwap: () => setIdeaOffset((value) => value + 1),
		onLogPlanned: (meal) => openDraft(draftFromMeal(meal)),
	});

	return (
		<View style={styles.column}>
			<MacrosCard eaten={day.eaten} targets={day.targets} />
			<WaterCard
				ml={day.waterMl}
				goalMl={day.targets.waterMl}
				onAdd={() => foodActions.addWater(day.today, 250)}
				onEdit={() => setWaterOpen(true)}
			/>
			<MealsCard slots={day.slots} onLog={onLog} />
			<DinnerIdeaCard {...idea} />
			<QuickLog onPhoto={photo} onSay={() => setVoiceOpen(true)} />
			<AskBar
				placeholder="Log a meal or water…"
				suggestions={[
					{ label: "Log a meal", onPress: () => openDraft({ slot: currentSlot }) },
					{ label: "Add water", onPress: () => setWaterOpen(true) },
					{ label: "Recipes", onPress: () => openRecipes() },
				]}
				onSubmit={submit}
			/>
			{draft ? (
				<LogMealSheet
					key={draft.key}
					draft={draft.value}
					day={day.today}
					onClose={() => setDraft(null)}
				/>
			) : null}
			<WaterSheet
				visible={waterOpen}
				day={day.today}
				ml={day.waterMl}
				goalMl={day.targets.waterMl}
				onClose={() => setWaterOpen(false)}
			/>
			{voiceOpen ? (
				<SayItSheet
					onClose={() => setVoiceOpen(false)}
					onDone={(transcript) => {
						setVoiceOpen(false);
						const parsed = parseFoodText(transcript);
						if (parsed?.kind === "water") {
							foodActions.addWater(day.today, parsed.ml);
							haptics.success();
							return;
						}
						const next: MealDraft = {
							slot: parsed?.slot ?? currentSlot,
							name: parsed?.name ?? transcript,
							kcal: parsed?.kcal ?? null,
							protein: parsed?.kind === "meal" ? parsed.protein : undefined,
						};
						// Let the voice sheet finish closing; iOS drops a modal presented mid-dismiss.
						setTimeout(() => openDraft(next), SHEET_HANDOFF_MS);
					}}
				/>
			) : null}
		</View>
	);
}

type IdeaInput = {
	dinner: SlotSummary | undefined;
	ranked: Recipe[];
	offset: number;
	left: ReturnType<typeof useFoodDay>["left"];
	targetKcal: number;
	today: string;
	onSwap: () => void;
	onLogPlanned: (meal: Meal) => void;
};

/** What the Dinner idea card says and does: suggest, show the plan, or point to recipes. */
function ideaFor(input: IdeaInput): DinnerIdeaCardProps {
	const { dinner, ranked, offset, left, targetKcal, today } = input;
	const browse = { label: "Browse recipes", onPress: () => openRecipes() };

	if (dinner && dinner.eaten.length > 0) {
		const parts: IdeaPart[] = [
			{ text: "Dinner is logged. " },
			{ text: "Recipes", strong: true },
			{ text: " has ideas for tomorrow." },
		];
		return { title: "Dinner idea", parts, primary: browse };
	}

	const planned = dinner?.planned ?? null;
	if (planned) {
		const recipe = planned.recipeId ? recipeById(planned.recipeId) : null;
		const index = recipe ? ranked.findIndex((item) => item.id === recipe.id) : -1;
		const next = ranked[(index + 1) % Math.max(1, ranked.length)];
		return {
			title: "Dinner plan",
			parts: [
				{ text: "Planned for tonight: " },
				{ text: planned.name, strong: true },
				{ text: `, about ${planned.kcal} kcal. Log it once you've eaten.` },
			],
			primary: { label: "Log dinner", onPress: () => input.onLogPlanned(planned) },
			secondary: next
				? {
						label: "Swap",
						onPress: () => foodActions.saveMeal(plannedFrom(next, today, planned.id)),
					}
				: undefined,
			onOpen: recipe ? () => openRecipe(recipe.id) : undefined,
		};
	}

	const recipe = ranked.length > 0 ? ranked[offset % ranked.length] : undefined;
	if (!recipe)
		return { title: "Dinner idea", parts: [{ text: "No recipes yet." }], primary: browse };
	return {
		title: "Dinner idea",
		parts: dinnerIdeaText(recipe, left, targetKcal),
		primary: {
			label: "Plan for dinner",
			onPress: () => {
				foodActions.addMeal(plannedFrom(recipe, today));
				haptics.success();
			},
		},
		secondary: { label: "Swap", onPress: input.onSwap },
		onOpen: () => openRecipe(recipe.id),
	};
}

const styles = StyleSheet.create({
	column: { gap: 16 },
});
