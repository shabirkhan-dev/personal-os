import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { usePoTheme } from "@/theme";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { formatKcal, MEAL_SLOTS, type Meal, type MealSlot, slotLabel } from "../lib/meals";
import { foodActions, useFoodStore } from "../store/food-store";

/** What the sheet opens with; anything left out starts empty. */
export type MealDraft = {
	slot: MealSlot;
	name?: string;
	kcal?: number | null;
	protein?: number;
	carbs?: number;
	fat?: number;
	photoUri?: string;
	recipeId?: string;
	/** A planned meal this entry confirms (keeps its id). */
	mealId?: string;
	/** A line under the fields, e.g. why calories must be typed for a photo. */
	note?: string;
};

export type LogMealSheetProps = {
	draft: MealDraft;
	day: string;
	onClose: () => void;
	onLogged?: (meal: Meal) => void;
};

let draftSeq = 0;

/** A fresh React key so each opening of the sheet starts from its draft. */
export function nextDraftKey(): number {
	draftSeq += 1;
	return draftSeq;
}

const SLOT_OPTIONS = MEAL_SLOTS.map((slot) => ({ value: slot, label: slotLabel(slot) }));

const text = (value: number | null | undefined) =>
	value === null || value === undefined ? "" : String(Math.round(value));

/** "12", "12.5" or "12,5" → number; empty or junk → undefined. */
function readNumber(value: string): number | undefined {
	const cleaned = value.replace(",", ".").trim();
	if (!cleaned) return undefined;
	const parsed = Number(cleaned);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function LoggedList({ day, slot }: { day: string; slot: MealSlot }) {
	const { colors } = usePoTheme();
	const meals = useFoodStore((state) => state.data.meals);
	const logged = meals.filter((meal) => meal.dayKey === day && meal.slot === slot && !meal.planned);
	if (logged.length === 0) return null;
	return (
		<View style={[styles.logged, { borderColor: colors.borderDefault }]}>
			<PoText variant="eyebrow11" tone="textTertiary">
				Logged today
			</PoText>
			{logged.map((meal) => (
				<View key={meal.id} style={styles.loggedRow}>
					<PoText variant="text14" numberOfLines={1} style={styles.grow}>
						{meal.name}
					</PoText>
					<PoText variant="mono13" tone="textSecondary">
						{formatKcal(meal.kcal)} kcal
					</PoText>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={`Remove ${meal.name}`}
						hitSlop={8}
						onPress={() => {
							haptics.select();
							foodActions.removeMeal(meal.id);
						}}
						style={[styles.remove, { backgroundColor: colors.bgSubtle }]}
					>
						<Icon name="Line/Close" size={12} color={colors.textSecondary} />
					</Pressable>
				</View>
			))}
		</View>
	);
}

/** Log meal: slot, name, calories and optional macros, with a photo when one was taken. */
export function LogMealSheet({ draft, day, onClose, onLogged }: LogMealSheetProps) {
	const { colors } = usePoTheme();
	const [slot, setSlot] = useState<MealSlot>(draft.slot);
	const [name, setName] = useState(draft.name ?? "");
	const [kcal, setKcal] = useState(text(draft.kcal));
	const [protein, setProtein] = useState(text(draft.protein));
	const [carbs, setCarbs] = useState(text(draft.carbs));
	const [fat, setFat] = useState(text(draft.fat));
	const [photoUri, setPhotoUri] = useState(draft.photoUri);

	const kcalValue = readNumber(kcal);
	const canSave = name.trim().length > 0 && kcalValue !== undefined && kcalValue > 0;

	const save = () => {
		if (!canSave || kcalValue === undefined) return;
		const meal: Meal = {
			id: draft.mealId ?? newId(),
			dayKey: day,
			slot,
			name: name.trim(),
			kcal: Math.round(kcalValue),
			at: new Date().toISOString(),
		};
		const p = readNumber(protein);
		const c = readNumber(carbs);
		const f = readNumber(fat);
		if (p !== undefined) meal.protein = p;
		if (c !== undefined) meal.carbs = c;
		if (f !== undefined) meal.fat = f;
		if (photoUri) meal.photoUri = photoUri;
		if (draft.recipeId) meal.recipeId = draft.recipeId;
		foodActions.logMeal(meal);
		haptics.success();
		onLogged?.(meal);
		onClose();
	};

	return (
		<Sheet
			visible
			title="Log meal"
			onClose={onClose}
			action={{ label: `Log ${slotLabel(slot).toLowerCase()}`, onPress: save, disabled: !canSave }}
		>
			<ChoiceChips options={SLOT_OPTIONS} value={slot} onChange={setSlot} />
			<LoggedList day={day} slot={slot} />
			{photoUri ? (
				<View>
					<Image
						source={{ uri: photoUri }}
						accessibilityLabel="Meal photo"
						style={[styles.photo, { backgroundColor: colors.bgSubtle }]}
					/>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Remove photo"
						hitSlop={8}
						onPress={() => setPhotoUri(undefined)}
						style={[styles.photoRemove, { backgroundColor: colors.bgSurface }]}
					>
						<Icon name="Line/Close" size={14} color={colors.textPrimary} />
					</Pressable>
				</View>
			) : null}
			<TextField
				label="What did you eat?"
				value={name}
				onChangeText={setName}
				placeholder="2 rotis and daal"
			/>
			<TextField
				label="Calories"
				value={kcal}
				onChangeText={setKcal}
				placeholder="450"
				keyboardType="number-pad"
				suffix="kcal"
			/>
			<View style={styles.macros}>
				<View style={styles.grow}>
					<TextField
						label="Protein"
						value={protein}
						onChangeText={setProtein}
						keyboardType="decimal-pad"
						suffix="g"
					/>
				</View>
				<View style={styles.grow}>
					<TextField
						label="Carbs"
						value={carbs}
						onChangeText={setCarbs}
						keyboardType="decimal-pad"
						suffix="g"
					/>
				</View>
				<View style={styles.grow}>
					<TextField
						label="Fat"
						value={fat}
						onChangeText={setFat}
						keyboardType="decimal-pad"
						suffix="g"
					/>
				</View>
			</View>
			<PoText variant="meta13" tone="textTertiary">
				{draft.note ?? "Macros are optional; they fill the Macros card when you add them."}
			</PoText>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	grow: { flex: 1 },
	macros: { flexDirection: "row", gap: 8 },
	logged: { gap: 8, paddingBottom: 12, borderBottomWidth: 1 },
	loggedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	remove: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	photo: { width: "100%", height: 160, borderRadius: 16 },
	photoRemove: {
		position: "absolute",
		top: 8,
		right: 8,
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
});
