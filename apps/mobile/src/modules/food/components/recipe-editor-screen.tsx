import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, TextInput, View } from "react-native";
import { textStyles } from "@personal-os/tokens";
import { Icon } from "@/components/icons";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { toTextStyle, usePoTheme } from "@/theme";
import { deleteMyRecipe, saveMyRecipe } from "../data/food-actions";
import { useFood } from "../hooks/use-food";
import { SLOT_LABELS, SLOTS, type Slot } from "../lib/food-model";
import { blankRecipe, myRecipeId } from "../lib/my-recipes";
import { RECIPE_TAGS, type Recipe, recipeById, TAG_LABELS, videoSearch } from "../lib/recipes";
import { foodRoutes } from "../navigation";
import { foodAiMessage, useFoodAi } from "../services/food-ai";
import { forgetPhoto, mealPhoto } from "../services/meal-photo";
import { FoodScreen } from "./food-screen";
import { MealImage } from "./meal-image";

const inputStyle = toTextStyle(textStyles.body15);

const num = (text: string) => {
	const value = Number(text.replace(",", "."));
	return Number.isFinite(value) && value >= 0 ? value : 0;
};
const str = (value: number) => (value ? String(value) : "");

/** Starts from the person's recipe to edit, a copy of a bundled one, or a blank page. */
function startFrom(id: string | undefined, copy: string | undefined): Recipe {
	const existing = id ? recipeById(id) : undefined;
	if (existing?.mine) return existing;
	const source = copy ? recipeById(copy) : undefined;
	if (source) {
		return {
			...source,
			id: myRecipeId(),
			name: `${source.name} (mine)`,
			photo: "",
			image: null,
			mine: true,
			kind: source.kind,
			uses: [],
			video: source.video ?? null,
			note: "",
		};
	}
	return blankRecipe();
}

/**
 * Write a recipe of your own: photo, name, when you eat it, time, servings, numbers per serving,
 * ingredients, steps with timers, a video and a note. AI can fill in a first draft from the name.
 */
export function RecipeEditorScreen({ id, copy }: { id?: string; copy?: string }) {
	const { colors } = usePoTheme();
	const data = useFood();
	const ai = useFoodAi();
	const [draft, setDraft] = useState<Recipe>(() => startFrom(id, copy));
	const [loaded, setLoaded] = useState(Boolean(!id || recipeById(id)));
	const [notice, setNotice] = useState<string | null>(null);
	const [drafting, setDrafting] = useState(false);
	const editing = Boolean(id && recipeById(id)?.mine);

	// The person's recipes arrive with the collection; open the one asked for once it's there.
	useEffect(() => {
		if (loaded || data.loading) return;
		setDraft(startFrom(id, copy));
		setLoaded(true);
	}, [loaded, data.loading, id, copy]);

	const set = (patch: Partial<Recipe>) => setDraft((current) => ({ ...current, ...patch }));

	const toggleSlot = (slot: Slot) => {
		haptics.select();
		const has = draft.slots.includes(slot);
		const slots = has ? draft.slots.filter((item) => item !== slot) : [...draft.slots, slot];
		set({ slots: slots.length ? SLOTS.filter((item) => slots.includes(item)) : draft.slots });
	};

	const photo = async (source: "camera" | "library") => {
		const result = await mealPhoto(source);
		if (result.status === "ok") {
			if (draft.image && draft.image !== recipeById(draft.id)?.image) forgetPhoto(draft.image);
			set({ image: result.uri });
		} else if (result.status === "denied") {
			setNotice("Food needs camera or photo access for this. You can allow it in Settings.");
		} else if (result.status === "error") {
			setNotice("Couldn't get that photo. Try again.");
		}
	};

	const fillWithAi = () => {
		if (!draft.name.trim()) {
			setNotice("Name the dish first, then AI can write a first draft.");
			return;
		}
		setDrafting(true);
		setNotice(null);
		ai.draftRecipe({ name: draft.name.trim(), notes: draft.note ?? "", serves: draft.serves })
			.then((result) => {
				haptics.success();
				setDraft((current) => ({
					...current,
					kind: result.kind || current.kind,
					slots: result.slots.length ? result.slots : current.slots,
					minutes: result.minutes || current.minutes,
					kcal: current.kcal || Math.round(result.kcal),
					protein: current.protein || Math.round(result.protein),
					carbs: current.carbs || Math.round(result.carbs),
					fat: current.fat || Math.round(result.fat),
					ingredients: current.ingredients.length ? current.ingredients : result.ingredients,
					steps: current.steps.length
						? current.steps
						: result.steps.map((step) =>
								step.minutes ? { text: step.text, minutes: step.minutes } : { text: step.text },
							),
				}));
				setNotice("Drafted. Change anything that isn't how you make it.");
			})
			.catch((error: unknown) => setNotice(foodAiMessage(error)))
			.finally(() => setDrafting(false));
	};

	const save = () => {
		const name = draft.name.trim();
		if (!name) {
			setNotice("Give the recipe a name.");
			return;
		}
		const recipe: Recipe = {
			...draft,
			name,
			ingredients: draft.ingredients.filter((item) => item.name.trim()),
			steps: draft.steps.filter((step) => step.text.trim()),
			video: draft.video?.trim() || null,
		};
		saveMyRecipe(recipe)
			.then(() => {
				haptics.success();
				foodRoutes.recipeReplace(recipe.id);
			})
			.catch((error: unknown) => {
				console.error("[food] could not save the recipe", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	const remove = () =>
		showDialog(
			`Delete ${draft.name || "this recipe"}?`,
			"Days in your plan that use it are left empty.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () =>
						void deleteMyRecipe(draft.id)
							.then(() => {
								forgetPhoto(draft.image ?? null);
								foodRoutes.recipes();
							})
							.catch((error: unknown) =>
								console.error("[food] could not delete the recipe", error),
							),
				},
			],
		);

	const ingredient = (index: number, patch: Partial<Recipe["ingredients"][number]>) =>
		set({
			ingredients: draft.ingredients.map((item, at) =>
				at === index ? { ...item, ...patch } : item,
			),
		});
	const step = (index: number, patch: Partial<Recipe["steps"][number]>) =>
		set({ steps: draft.steps.map((item, at) => (at === index ? { ...item, ...patch } : item)) });

	return (
		<FoodScreen label="Recipes">
			<ScreenTitle
				eyebrow={editing ? "Your recipe" : copy ? "Make it your own" : "A new recipe"}
				title={editing ? "Edit recipe" : "Write a recipe"}
			/>

			<View style={[styles.photoCard, { backgroundColor: colors.bgSurface }]}>
				{draft.image ? (
					<MealImage photo={draft.image} size={200} fill radius={20} />
				) : (
					<View style={[styles.photoEmpty, { backgroundColor: colors.bgSubtle }]}>
						<Icon name="Filled/Camera" size={28} color={colors.textTertiary} />
						<PoText variant="meta13" tone="textSecondary">
							A photo of the dish makes it easy to spot in your plan
						</PoText>
					</View>
				)}
				<View style={styles.row}>
					<PillButton
						label="Take photo"
						variant="secondary"
						style={styles.flex}
						onPress={() => void photo("camera")}
					/>
					<PillButton
						label="Choose"
						variant="secondary"
						style={styles.flex}
						onPress={() => void photo("library")}
					/>
				</View>
				{draft.image ? (
					<Pressable
						accessibilityRole="button"
						onPress={() => set({ image: null })}
						style={styles.center}
					>
						<PoText variant="meta13" tone="textLink">
							Remove photo
						</PoText>
					</Pressable>
				) : null}
			</View>

			<Section title="The dish">
				<TextField
					label="Name"
					value={draft.name}
					onChangeText={(name) => set({ name })}
					placeholder="Ammi's aloo keema"
				/>
				{ai.available ? (
					<PillButton
						label={drafting ? "Writing a draft…" : "Fill in with AI"}
						variant="secondary"
						disabled={drafting}
						onPress={fillWithAi}
					/>
				) : null}
				<PoText variant="meta13" tone="textSecondary">
					When you eat it
				</PoText>
				<View style={styles.chips}>
					{SLOTS.map((slot) => (
						<FilterChip
							key={slot}
							label={SLOT_LABELS[slot]}
							selected={draft.slots.includes(slot)}
							onPress={() => toggleSlot(slot)}
						/>
					))}
				</View>
				<View style={styles.row}>
					<View style={styles.flex}>
						<TextField
							label="Minutes"
							value={str(draft.minutes)}
							onChangeText={(text) => set({ minutes: Math.round(num(text)) })}
							keyboardType="number-pad"
							suffix="min"
						/>
					</View>
					<View style={styles.flex}>
						<TextField
							label="Serves"
							value={str(draft.serves)}
							onChangeText={(text) => set({ serves: Math.max(1, Math.round(num(text))) })}
							keyboardType="number-pad"
						/>
					</View>
				</View>
			</Section>

			<Section
				title="Per serving"
				hint="Leave a number empty if you don't know it. The plan only auto-picks recipes with calories."
			>
				<View style={styles.row}>
					<View style={styles.flex}>
						<TextField
							label="Calories"
							value={str(draft.kcal)}
							onChangeText={(text) => set({ kcal: Math.round(num(text)) })}
							keyboardType="number-pad"
							suffix="kcal"
						/>
					</View>
					<View style={styles.flex}>
						<TextField
							label="Protein"
							value={str(draft.protein)}
							onChangeText={(text) => set({ protein: num(text) })}
							keyboardType="decimal-pad"
							suffix="g"
						/>
					</View>
				</View>
				<View style={styles.row}>
					<View style={styles.flex}>
						<TextField
							label="Carbs"
							value={str(draft.carbs)}
							onChangeText={(text) => set({ carbs: num(text) })}
							keyboardType="decimal-pad"
							suffix="g"
						/>
					</View>
					<View style={styles.flex}>
						<TextField
							label="Fat"
							value={str(draft.fat)}
							onChangeText={(text) => set({ fat: num(text) })}
							keyboardType="decimal-pad"
							suffix="g"
						/>
					</View>
				</View>
				<TextField
					label="Cost per serving"
					value={str(draft.cost)}
					onChangeText={(text) => set({ cost: Math.round(num(text)) })}
					keyboardType="number-pad"
					suffix="Rs"
				/>
			</Section>

			<Section
				title="Ingredients"
				right={draft.ingredients.length ? `${draft.ingredients.length}` : undefined}
			>
				{draft.ingredients.map((item, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- rows are edited in place
					<View key={index} style={[styles.line, { backgroundColor: colors.bgSubtle }]}>
						<TextInput
							value={item.name}
							onChangeText={(name) => ingredient(index, { name })}
							placeholder="Ingredient"
							placeholderTextColor={colors.textTertiary}
							accessibilityLabel={`Ingredient ${index + 1}`}
							style={[inputStyle, styles.lineInput, { color: colors.textPrimary }]}
						/>
						<TextInput
							value={item.amount}
							onChangeText={(amount) => ingredient(index, { amount })}
							placeholder="Amount"
							placeholderTextColor={colors.textTertiary}
							accessibilityLabel={`Amount for ingredient ${index + 1}`}
							style={[inputStyle, styles.amount, { color: colors.textSecondary }]}
						/>
						<RemoveButton
							label={`Remove ${item.name || "ingredient"}`}
							onPress={() =>
								set({ ingredients: draft.ingredients.filter((_, at) => at !== index) })
							}
						/>
					</View>
				))}
				<AddRow
					label="Add an ingredient"
					onPress={() => set({ ingredients: [...draft.ingredients, { name: "", amount: "" }] })}
				/>
			</Section>

			<Section
				title="Steps"
				hint="One action per step. Add minutes when there's waiting: Cook mode times it for you."
			>
				{draft.steps.map((item, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- rows are edited in place
					<View key={index} style={styles.stepRow}>
						<View style={[styles.number, { backgroundColor: colors.accentSubtle }]}>
							<PoText variant="meta13" tone="accentDefault">
								{index + 1}
							</PoText>
						</View>
						<View style={[styles.stepBox, { backgroundColor: colors.bgSubtle }]}>
							<TextInput
								value={item.text}
								onChangeText={(text) => step(index, { text })}
								placeholder="What to do"
								placeholderTextColor={colors.textTertiary}
								multiline
								accessibilityLabel={`Step ${index + 1}`}
								style={[inputStyle, styles.stepInput, { color: colors.textPrimary }]}
							/>
							<View style={styles.stepFoot}>
								<Icon name="Clock" size={14} color={colors.textTertiary} />
								<TextInput
									value={item.minutes ? String(item.minutes) : ""}
									onChangeText={(text) => {
										const minutes = Math.round(num(text));
										step(index, minutes ? { minutes } : { minutes: undefined });
									}}
									placeholder="min"
									placeholderTextColor={colors.textTertiary}
									keyboardType="number-pad"
									accessibilityLabel={`Minutes for step ${index + 1}`}
									style={[inputStyle, styles.minutes, { color: colors.textSecondary }]}
								/>
								<View style={styles.flex} />
								<RemoveButton
									label={`Remove step ${index + 1}`}
									onPress={() => set({ steps: draft.steps.filter((_, at) => at !== index) })}
								/>
							</View>
						</View>
					</View>
				))}
				<AddRow label="Add a step" onPress={() => set({ steps: [...draft.steps, { text: "" }] })} />
			</Section>

			<Section title="Video and notes">
				<TextField
					label="Video link (optional)"
					value={draft.video ?? ""}
					onChangeText={(video) => set({ video })}
					placeholder="https://youtube.com/…"
					keyboardType="url"
				/>
				<Pressable
					accessibilityRole="link"
					onPress={() =>
						void Linking.openURL(videoSearch({ name: draft.name || "home cooking" })).catch(
							(error: unknown) => console.warn("[food] could not open YouTube", error),
						)
					}
					style={styles.link}
				>
					<Icon name="Filled/Play" size={14} color={colors.textLink} />
					<PoText variant="meta13" tone="textLink">
						Find one on YouTube
					</PoText>
				</Pressable>
				<TextField
					label="Note (optional)"
					value={draft.note ?? ""}
					onChangeText={(note) => set({ note })}
					placeholder="Less chilli for Ammi. Tastes better the next day."
					multiline
				/>
				<PoText variant="meta13" tone="textSecondary">
					Tags
				</PoText>
				<View style={styles.chips}>
					{RECIPE_TAGS.map((tag) => (
						<FilterChip
							key={tag}
							label={TAG_LABELS[tag]}
							selected={draft.tags.includes(tag)}
							onPress={() =>
								set({
									tags: draft.tags.includes(tag)
										? draft.tags.filter((item) => item !== tag)
										: [...draft.tags, tag],
								})
							}
						/>
					))}
				</View>
			</Section>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			<Footer>
				{editing ? (
					<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
				) : null}
				<PillButton label="Save recipe" style={styles.flex} onPress={save} />
			</Footer>
		</FoodScreen>
	);
}

function Section({
	title,
	right,
	hint,
	children,
}: {
	title: string;
	right?: string;
	hint?: string;
	children: React.ReactNode;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
			<View style={styles.sectionHead}>
				<PoText variant="title18" style={styles.flex}>
					{title}
				</PoText>
				{right ? (
					<PoText variant="meta13" tone="textTertiary">
						{right}
					</PoText>
				) : null}
			</View>
			{hint ? (
				<PoText variant="meta13" tone="textSecondary">
					{hint}
				</PoText>
			) : null}
			{children}
		</View>
	);
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={8}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={[styles.remove, { backgroundColor: colors.bgSurface }]}
		>
			<Icon name="Line/Close" size={14} color={colors.textSecondary} />
		</Pressable>
	);
}

function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [
				styles.add,
				{
					borderColor: colors.borderStrong,
					backgroundColor: pressed ? colors.bgHover : "transparent",
				},
			]}
		>
			<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
			<PoText variant="text14Medium" tone="textSecondary">
				{label}
			</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0 },
	row: { flexDirection: "row", gap: 8 },
	center: { alignItems: "center", paddingVertical: 4 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	photoCard: { gap: 12, padding: 8, borderRadius: 24 },
	photoEmpty: {
		height: 160,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 24,
	},
	section: { gap: 12, padding: 16, borderRadius: 20 },
	sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	line: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingLeft: 16,
		paddingRight: 8,
		borderRadius: 16,
	},
	lineInput: { flex: 1, minWidth: 0 },
	amount: { width: 96, minWidth: 0, textAlign: "right" },
	remove: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	add: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 44,
		borderRadius: 16,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	stepRow: { flexDirection: "row", gap: 12 },
	number: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 10,
	},
	stepBox: {
		flex: 1,
		gap: 4,
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 8,
		borderRadius: 16,
	},
	stepInput: { minHeight: 44, minWidth: 0, paddingVertical: 0 },
	stepFoot: { flexDirection: "row", alignItems: "center", gap: 6 },
	minutes: { width: 56, minWidth: 0, paddingVertical: 0 },
	link: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
	notice: { paddingHorizontal: 8 },
});
