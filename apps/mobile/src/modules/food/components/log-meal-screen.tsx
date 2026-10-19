import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { Icon } from "@/components/icons";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { clock } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { AskBar } from "@/modules/home/components/ask-bar";
import { usePoTheme } from "@/theme";
import { deleteMeal, logMeal } from "../data/food-actions";
import { draftFromText, FOOD_READ_JOB, type MealDraft, useFoodUi } from "../hooks/food-ui-store";
import { nextSlot, sumMacros } from "../lib/food-math";
import { type FoodItem, SLOT_LABELS, SLOT_TIMES, SLOTS, type Slot } from "../lib/food-model";
import { capital, withQuantity } from "../lib/parse-meal";
import { foodAiMessage, useFoodAi } from "../services/food-ai";
import { mealPhoto } from "../services/meal-photo";
import { Card, kcalText } from "./home-cards";
import { FoodScreen } from "./food-screen";
import { MealImage } from "./meal-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const READ_STEPS = [
	"Reading what you ate",
	"Estimating portions",
	"Adding up the numbers",
] as const;

const step = (quantity: number) => (quantity < 1 ? 0.5 : 1);

function sourceLine(draft: MealDraft, count: number): string {
	const items = `${count} item${count === 1 ? "" : "s"}`;
	if (draft.source === "barcode") return `Barcode matched · ${items}`;
	const heard = draft.source === "voice" ? "voice" : "text";
	if (draft.photo && draft.text) return `Photo and ${heard} matched · ${items}`;
	if (draft.photo) return "Photo attached · say or type what's on the plate";
	return `Matched from your ${heard} · ${items}`;
}

/** Log meal: the photo, what was said or typed, the matched items with their numbers, and a slot. */
export function LogMealScreen() {
	const { colors } = usePoTheme();
	const now = useNow();
	const draft = useFoodUi((state) => state.draft);
	const setDraft = useFoodUi((state) => state.setDraft);
	const ai = useFoodAi();
	const readJob = useAiJobs((state) => state.jobs[FOOD_READ_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [started] = useState(() => draft);
	const [items, setItems] = useState<FoodItem[]>(() => draft?.items ?? []);
	const [slot, setSlot] = useState<Slot>(
		() => draft?.slot ?? nextSlot(now.getHours() * 60 + now.getMinutes(), SLOT_TIMES),
	);
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState(false);
	const [custom, setCustom] = useState({ name: "", kcal: "", protein: "" });

	const current: MealDraft = draft ?? {
		text: "",
		items: [],
		unmatched: [],
		slot: null,
		photo: null,
		source: "voice",
	};
	const totals = useMemo(() => sumMacros(items), [items]);

	// Words the phone didn't know go to the Food AI, in the background.
	const readWithAi = (text: string) => {
		if (!ai.available) {
			setNotice(
				"Some words weren't matched. Add them with Edit items, or connect to read them with AI.",
			);
			return;
		}
		startJob(FOOD_READ_JOB, "Reading your meal", async () => {
			try {
				const reading = await ai.readMeal(text);
				const read = reading.items.map((item) => ({ ...item, foodId: null }));
				setItems((list) => {
					const known = new Set(list.map((item) => item.name.toLowerCase()));
					return [...list, ...read.filter((item) => !known.has(item.name.toLowerCase()))];
				});
				if (reading.slot) setSlot(reading.slot);
			} catch (error) {
				throw new Error(foodAiMessage(error), { cause: error });
			}
		});
	};

	useEffect(() => {
		if (started && started.unmatched.length > 0) readWithAi(started.text);
		// oxlint-disable-next-line react/exhaustive-deps -- once, for the draft the screen opened with
	}, []);

	const onLine = (text: string, spoken: boolean) => {
		const next = draftFromText(text, spoken ? "voice" : "text", current.photo);
		setDraft({ ...next, replace: current.replace });
		setItems((list) => [...list, ...next.items]);
		if (next.slot) setSlot(next.slot);
		if (next.unmatched.length > 0) readWithAi(text);
		else setNotice(null);
	};

	const change = (index: number, direction: 1 | -1) => {
		haptics.select();
		setItems((list) =>
			list.flatMap((item, at) => {
				if (at !== index) return [item];
				const amount = item.quantity <= 1 && direction === -1 ? 0.5 : step(item.quantity);
				const next = Math.round((item.quantity + direction * amount) * 10) / 10;
				return next <= 0 ? [] : [withQuantity(item, next)];
			}),
		);
	};

	const addCustom = () => {
		const name = custom.name.trim();
		const kcal = Number(custom.kcal);
		if (!name || !Number.isFinite(kcal) || kcal <= 0) {
			setNotice("Give the item a name and its calories.");
			return;
		}
		const protein = Math.max(0, Number(custom.protein) || 0);
		setItems((list) => [
			...list,
			{
				name: capital(name),
				quantity: 1,
				unit: "",
				foodId: null,
				kcal: Math.round(kcal),
				protein,
				carbs: 0,
				fat: 0,
			},
		]);
		setCustom({ name: "", kcal: "", protein: "" });
		setEditing(false);
	};

	const changePhoto = async () => {
		const result = await mealPhoto("camera");
		if (result.status === "ok") setDraft({ ...current, photo: result.uri });
		if (result.status === "denied") setNotice("Allow the camera in Settings to snap a meal.");
	};

	const save = async () => {
		if (items.length === 0) return;
		setSaving(true);
		try {
			await logMeal({
				slot,
				items,
				photo: current.photo,
				day: current.replace?.[0]?.day,
				recipeId: current.replace?.[0]?.recipeId ?? null,
			});
			await Promise.all((current.replace ?? []).map((meal) => deleteMeal(meal)));
			haptics.success();
			setDraft(null);
			router.back();
		} catch (error) {
			console.error("[food] could not log the meal", error);
			setNotice("Couldn't save on this phone. Try again.");
			setSaving(false);
		}
	};

	const remove = async () => {
		try {
			await Promise.all((current.replace ?? []).map((meal) => deleteMeal(meal)));
			setDraft(null);
			router.back();
		} catch (error) {
			console.error("[food] could not delete the meal", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const editingOld = (current.replace?.length ?? 0) > 0;

	return (
		<FoodScreen
			action={{ icon: "Filled/Edit", label: "Edit items", onPress: () => setEditing(true) }}
		>
			<ScreenTitle
				eyebrow={`${editingOld ? "Edit" : "Log"} · ${WEEKDAYS[now.getDay()]} ${clock(now)}`}
				title="What did you eat?"
			/>
			{current.photo ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Retake the photo"
					onPress={() => void changePhoto()}
				>
					<MealImage photo={current.photo} size={190} fill radius={28} />
				</Pressable>
			) : null}

			{current.text ? (
				<View
					style={[
						styles.said,
						{ backgroundColor: colors.bgSurface, borderColor: colors.accentDefault },
					]}
				>
					<PoText variant="body15">{current.text}</PoText>
					<View style={styles.status}>
						<View
							style={[
								styles.dot,
								{ backgroundColor: items.length > 0 ? colors.statusSuccess : colors.statusCaution },
							]}
						/>
						<PoText variant="meta13" tone="textSecondary">
							{sourceLine(current, items.length)}
						</PoText>
					</View>
				</View>
			) : null}
			<AskBar
				suggestions={[]}
				placeholder={items.length > 0 ? "Add something else…" : "Say or type what you ate…"}
				onSubmit={onLine}
				autoListen={draft === null}
			/>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{readJob ? (
				<AiWorkingCard
					job={readJob}
					steps={READ_STEPS}
					onRetry={() => retryJob(FOOD_READ_JOB)}
					onDismiss={() => dismissJob(FOOD_READ_JOB)}
				/>
			) : null}

			{items.length > 0 ? (
				<Card>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							{`Found ${items.length} item${items.length === 1 ? "" : "s"}`}
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							tap to adjust
						</PoText>
					</View>
					{items.map((item, index) => (
						<View key={`${item.name}-${index}`} style={styles.item}>
							<View style={styles.flex}>
								<PoText variant="row15" numberOfLines={1}>
									{item.name}
								</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{`${Math.round(item.protein)} g protein`}
								</PoText>
							</View>
							<View style={[styles.stepper, { backgroundColor: colors.bgSubtle }]}>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Less ${item.name}`}
									hitSlop={8}
									onPress={() => change(index, -1)}
								>
									<Icon name="Minus" size={14} color={colors.textSecondary} />
								</Pressable>
								<PoText variant="mono13" tone="textSecondary">
									{item.unit ? `${item.quantity} ${item.unit}` : `× ${item.quantity}`}
								</PoText>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`More ${item.name}`}
									hitSlop={8}
									onPress={() => change(index, 1)}
								>
									<Icon name="Line/Plus" size={14} color={colors.textSecondary} />
								</Pressable>
							</View>
							<PoText variant="row15" style={styles.kcal}>
								{kcalText(item.kcal)}
								<PoText variant="meta13" tone="textTertiary">
									{" kcal"}
								</PoText>
							</PoText>
						</View>
					))}
				</Card>
			) : null}

			{items.length > 0 ? (
				<View style={styles.totals}>
					{[
						{ label: "Kcal", value: kcalText(totals.kcal) },
						{ label: "Protein", value: `${Math.round(totals.protein)} g` },
						{ label: "Carbs", value: `${Math.round(totals.carbs)} g` },
						{ label: "Fat", value: `${Math.round(totals.fat)} g` },
					].map((total) => (
						<View
							key={total.label}
							style={[
								styles.total,
								{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
							]}
						>
							<PoText variant="eyebrow11" tone="textTertiary">
								{total.label}
							</PoText>
							<PoText variant="title18">{total.value}</PoText>
						</View>
					))}
				</View>
			) : null}

			<View style={styles.slots}>
				{SLOTS.map((option) => (
					<FilterChip
						key={option}
						label={SLOT_LABELS[option]}
						selected={option === slot}
						onPress={() => setSlot(option)}
					/>
				))}
			</View>

			<Footer>
				{editingOld ? (
					<PillButton
						label="Delete"
						variant="secondary"
						style={styles.flex}
						onPress={() => void remove()}
					/>
				) : (
					<PillButton
						label="Edit items"
						variant="secondary"
						style={styles.flex}
						onPress={() => setEditing(true)}
					/>
				)}
				<PillButton
					label={saving ? "Saving…" : `Log ${SLOT_LABELS[slot].toLowerCase()}`}
					disabled={saving || items.length === 0}
					style={styles.flex}
					onPress={() => void save()}
				/>
			</Footer>

			<Sheet
				visible={editing}
				title="Add an item"
				onClose={() => setEditing(false)}
				action={{ label: "Add", onPress: addCustom }}
			>
				<TextField
					label="Name"
					value={custom.name}
					onChangeText={(name) => setCustom((value) => ({ ...value, name }))}
					placeholder="Chicken shawarma"
				/>
				<TextField
					label="Calories"
					value={custom.kcal}
					onChangeText={(kcal) => setCustom((value) => ({ ...value, kcal }))}
					keyboardType="number-pad"
					suffix="kcal"
				/>
				<TextField
					label="Protein"
					value={custom.protein}
					onChangeText={(protein) => setCustom((value) => ({ ...value, protein }))}
					keyboardType="number-pad"
					suffix="g"
					onSubmitEditing={addCustom}
				/>
			</Sheet>
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	said: { gap: 8, padding: 16, borderRadius: 24, borderWidth: 1.5 },
	status: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	notice: { paddingHorizontal: 6 },
	head: { flexDirection: "row", alignItems: "center" },
	item: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		height: 32,
		paddingHorizontal: 10,
		borderRadius: 16,
	},
	kcal: { minWidth: 72, textAlign: "right" },
	totals: { flexDirection: "row", gap: 8 },
	total: { flex: 1, gap: 4, padding: 12, borderRadius: 20, borderWidth: 1 },
	slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
