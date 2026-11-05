import { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, FilterChip, Footer, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { monthShort } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import {
	listFor,
	newGroceryId,
	removeGroceryItem,
	saveGroceryItem,
	saveGroceryItems,
} from "../data/food-actions";
import { useFoodToday } from "../hooks/use-food";
import { groceryTotal, sectionFor } from "../lib/food-math";
import {
	GROCERY_SECTIONS,
	type GroceryItem,
	type GroceryList,
	type GrocerySection,
	SECTION_LABELS,
} from "../lib/food-model";
import { packLabel, PRODUCTS } from "../lib/groceries";
import { foodRoutes } from "../navigation";
import { forgetPhoto, mealPhoto } from "../services/meal-photo";
import { FoodScreen } from "./food-screen";
import { Card } from "./home-cards";
import { MealImage } from "./meal-image";

const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const blank = (): GroceryItem => ({
	id: newGroceryId(),
	name: "",
	amount: "",
	section: "extras",
	price: 0,
	bought: false,
	atHome: false,
	custom: true,
	photo: null,
	note: "",
});

/**
 * Grocery list: what the plan needs plus anything added by hand, by aisle, against the weekly
 * food budget. Tap to tick off; the pencil (or a long press) opens an item for its details.
 */
export function GroceryScreen() {
	const { colors } = usePoTheme();
	const { data, weekId, today, plan } = useFoodToday();
	const list: GroceryList =
		data.groceries.find((item) => item.id === weekId) ??
		[...data.groceries].sort((a, b) => b.id.localeCompare(a.id))[0] ??
		listFor(data.groceries, weekId);
	const budget = data.settings.weeklyBudget;
	const [editing, setEditing] = useState<GroceryItem | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[food] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};
	const update = (items: GroceryItem[]) => {
		saveGroceryItems(list, items).catch(failed("save the list"));
	};
	const toggle = (id: string, key: "bought" | "atHome") => {
		haptics.select();
		update(list.items.map((item) => (item.id === id ? { ...item, [key]: !item[key] } : item)));
	};
	const names = new Set(list.items.map((item) => item.name.toLowerCase()));
	const quick = PRODUCTS.filter((product) => !names.has(product.name.toLowerCase())).slice(0, 14);
	const quickAdd = (id: string) => {
		const product = PRODUCTS.find((item) => item.id === id);
		if (!product) return;
		haptics.tap();
		saveGroceryItem(list, {
			...blank(),
			name: product.name,
			amount: packLabel(product, 1),
			section: product.section,
			price: product.price,
		}).catch(failed("add the item"));
	};

	const share = () => {
		const lines = GROCERY_SECTIONS.flatMap((section) => {
			const items = list.items.filter(
				(item) => item.section === section && !item.atHome && !item.bought,
			);
			return items.length
				? [
						`${SECTION_LABELS[section]}:`,
						...items.map(
							(item) =>
								`• ${item.name}${item.amount ? `, ${item.amount}` : ""}${item.note ? ` (${item.note})` : ""}`,
						),
						"",
					]
				: [];
		});
		void Share.share({ message: ["Grocery list", "", ...lines].join("\n").trim() }).catch(
			(error: unknown) => console.error("[food] could not share the list", error),
		);
	};

	const total = groceryTotal(list.items);
	const toBuy = list.items.filter((item) => !item.atHome);
	const bought = toBuy.filter((item) => item.bought).length;
	const atHome = list.items.length - toBuy.length;
	const days = (plan?.days ?? []).filter((day) => day.day >= today && day.meals.length > 0);
	const from = days[0] ? new Date(`${days[0].day}T12:00:00`) : null;
	const to = days.at(-1) ? new Date(`${days.at(-1)?.day}T12:00:00`) : null;
	const listDay = new Date(`${list.id}T12:00:00`);

	return (
		<FoodScreen
			action={{ icon: "Line/Plus", label: "Add an item", onPress: () => setEditing(blank()) }}
		>
			<ScreenTitle
				eyebrow={
					from && to
						? `For ${WEEKDAYS[from.getDay()]} to ${WEEKDAYS[to.getDay()]} · ${days.length} days`
						: `Week of ${listDay.getDate()} ${monthShort(listDay)}`
				}
				title="Grocery list"
			/>

			{list.items.length === 0 ? (
				<EmptyCard
					icon="Tag"
					title="Nothing on the list yet"
					body="Add what you need by hand, tap a common item below, or make the list from your meal plan with packs and rough prices."
				>
					<PillButton label="Add an item" onPress={() => setEditing(blank())} />
					<PillButton
						label={plan ? "Make it from the plan" : "Plan the week"}
						variant="secondary"
						onPress={foodRoutes.plan}
					/>
				</EmptyCard>
			) : (
				<Card>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							{money(total)}
							<PoText variant="meta13" tone="textSecondary">
								{`  of ${money(budget)} food budget`}
							</PoText>
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{`${bought} of ${toBuy.length} bought`}
						</PoText>
					</View>
					<ProgressBar
						share={budget > 0 ? total / budget : 1}
						tone={total > budget ? "statusDanger" : "statusSuccess"}
					/>
					<PoText variant="meta13" tone={total > budget ? "textDanger" : "textSuccess"}>
						{`${total > budget ? `${money(total - budget)} over` : `${money(budget - total)} left`}${atHome ? ` · ${atHome} already at home` : ""}`}
					</PoText>
				</Card>
			)}

			{quick.length > 0 ? (
				<View style={styles.quickBlock}>
					<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
						Quick add
					</PoText>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.quick}
					>
						{quick.map((product) => (
							<FilterChip
								key={product.id}
								label={`+ ${product.name}`}
								selected={false}
								onPress={() => quickAdd(product.id)}
							/>
						))}
					</ScrollView>
				</View>
			) : null}

			{GROCERY_SECTIONS.map((section) => {
				const items = list.items.filter((item) => item.section === section);
				if (items.length === 0) return null;
				return (
					<Card key={section}>
						<View style={styles.head}>
							<PoText variant="title18" style={styles.flex}>
								{SECTION_LABELS[section]}
							</PoText>
							<PoText variant="mono13" tone="textTertiary">
								{money(groceryTotal(items))}
							</PoText>
						</View>
						{items.map((item) => (
							<View key={item.id} style={styles.row}>
								<Pressable
									accessibilityRole="checkbox"
									accessibilityState={{ checked: item.bought }}
									accessibilityLabel={item.name}
									accessibilityHint="Long press for its details"
									onPress={() => toggle(item.id, "bought")}
									onLongPress={() => setEditing(item)}
									style={({ pressed }) => [styles.tick, pressed ? { opacity: 0.7 } : null]}
								>
									<Checkbox checked={item.bought} />
									{item.photo ? <MealImage photo={item.photo} size={36} radius={10} /> : null}
									<View style={styles.flex}>
										<PoText
											variant="row15"
											tone={item.atHome || item.bought ? "textTertiary" : "textPrimary"}
											numberOfLines={1}
										>
											{item.name}
										</PoText>
										{item.amount || item.note ? (
											<PoText variant="meta13" tone="textTertiary" numberOfLines={1}>
												{[item.amount, item.note].filter(Boolean).join(" · ")}
											</PoText>
										) : null}
									</View>
									<PoText
										variant="meta13"
										tone={item.atHome ? "textSuccess" : "textSecondary"}
										style={styles.price}
									>
										{item.atHome ? "At home" : item.price ? money(item.price) : "–"}
									</PoText>
								</Pressable>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Edit ${item.name}`}
									hitSlop={8}
									onPress={() => setEditing(item)}
									style={[styles.edit, { backgroundColor: colors.bgSubtle }]}
								>
									<Icon name="Filled/Edit" size={14} color={colors.textSecondary} />
								</Pressable>
							</View>
						))}
					</Card>
				);
			})}
			{list.items.length > 0 ? (
				<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
					Tap to tick off. The pencil opens an item for its photo, price, note or "already at home".
				</PoText>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			{list.items.length > 0 ? (
				<Footer>
					<PillButton label="Share list" variant="secondary" style={styles.flex} onPress={share} />
					<PillButton
						label={bought === toBuy.length ? "Clear ticked" : "Mark all bought"}
						style={styles.flex}
						onPress={() => {
							haptics.success();
							if (bought === toBuy.length) {
								// Done shopping: what came from the plan stays ticked, what was added by hand goes.
								update(list.items.filter((item) => !(item.custom && item.bought)));
								return;
							}
							update(list.items.map((item) => (item.atHome ? item : { ...item, bought: true })));
						}}
					/>
				</Footer>
			) : null}
			<ItemSheet
				item={editing}
				onClose={() => setEditing(null)}
				onSave={(item) => {
					saveGroceryItem(list, item)
						.then(() => haptics.success())
						.catch(failed("save the item"));
					setEditing(null);
				}}
				onDelete={(item) =>
					showDialog(`Remove ${item.name}?`, undefined, [
						{ text: "Cancel", style: "cancel" },
						{
							text: "Remove",
							style: "destructive",
							onPress: () => {
								removeGroceryItem(list, item.id)
									.then(() => forgetPhoto(item.photo))
									.catch(failed("remove the item"));
								setEditing(null);
							},
						},
					])
				}
			/>
		</FoodScreen>
	);
}

function ItemSheet({
	item,
	onClose,
	onSave,
	onDelete,
}: {
	item: GroceryItem | null;
	onClose: () => void;
	onSave: (item: GroceryItem) => void;
	onDelete: (item: GroceryItem) => void;
}) {
	const [draft, setDraft] = useState<GroceryItem | null>(item);
	const [price, setPrice] = useState("");
	const [error, setError] = useState<string | null>(null);
	const isNew = Boolean(item && !item.name);

	useEffect(() => {
		setDraft(item);
		setPrice(item?.price ? String(item.price) : "");
		setError(null);
	}, [item]);

	if (!draft) return null;
	const set = (patch: Partial<GroceryItem>) => setDraft({ ...draft, ...patch });

	const photo = async (source: "camera" | "library") => {
		const result = await mealPhoto(source);
		if (result.status === "ok") set({ photo: result.uri });
		else if (result.status === "denied") setError("Food needs camera or photo access for this.");
		else if (result.status === "error") setError("Couldn't get that photo. Try again.");
	};

	const save = () => {
		const name = draft.name.trim();
		if (!name) {
			setError("What is it? Add a name.");
			return;
		}
		const amount = Number(price.replace(/[^\d.]/g, ""));
		onSave({ ...draft, name, price: Number.isFinite(amount) ? Math.round(amount) : 0 });
	};

	return (
		<Sheet
			visible={item !== null}
			title={isNew ? "Add to the list" : draft.name}
			onClose={onClose}
			action={{ label: "Save", onPress: save }}
		>
			<View style={styles.photoRow}>
				<MealImage photo={draft.photo} size={64} radius={16} />
				<View style={styles.photoButtons}>
					<FilterChip label="Take photo" selected={false} onPress={() => void photo("camera")} />
					<FilterChip label="Choose" selected={false} onPress={() => void photo("library")} />
					{draft.photo ? (
						<FilterChip label="Remove" selected={false} onPress={() => set({ photo: null })} />
					) : null}
				</View>
			</View>
			<TextField
				label="What"
				value={draft.name}
				onChangeText={(name) =>
					set(isNew && draft.section === "extras" ? { name, section: sectionFor(name) } : { name })
				}
				placeholder="Olpers milk"
			/>
			<View style={styles.two}>
				<View style={styles.flex}>
					<TextField
						label="How much"
						value={draft.amount}
						onChangeText={(amount) => set({ amount })}
						placeholder="2 L"
					/>
				</View>
				<View style={styles.flex}>
					<TextField
						label="Price"
						value={price}
						onChangeText={setPrice}
						keyboardType="number-pad"
						suffix="Rs"
						placeholder="440"
					/>
				</View>
			</View>
			<PoText variant="meta13" tone="textSecondary">
				Aisle
			</PoText>
			<View style={styles.chips}>
				{GROCERY_SECTIONS.map((section: GrocerySection) => (
					<FilterChip
						key={section}
						label={SECTION_LABELS[section]}
						selected={draft.section === section}
						onPress={() => set({ section })}
					/>
				))}
			</View>
			<TextField
				label="Note (optional)"
				value={draft.note}
				onChangeText={(note) => set({ note })}
				placeholder="The green carton, from the Sunday bazaar"
			/>
			<View style={styles.toggleRow}>
				<PoText variant="row15" style={styles.flex}>
					Already at home
				</PoText>
				<Toggle
					value={draft.atHome}
					onChange={(atHome) => set({ atHome })}
					accessibilityLabel="Already at home"
				/>
			</View>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			{!isNew ? (
				<Pressable accessibilityRole="button" onPress={() => onDelete(draft)} style={styles.delete}>
					<PoText variant="text14Medium" tone="textDanger">
						Remove from the list
					</PoText>
				</Pressable>
			) : (
				<PoText variant="meta13" tone="textTertiary">
					Things you add stay on the list when it's made again from the plan.
				</PoText>
			)}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0 },
	pad: { paddingHorizontal: 8 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	tick: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
	price: { minWidth: 64, textAlign: "right" },
	edit: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
	quickBlock: { gap: 8 },
	quick: { gap: 8 },
	photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	photoButtons: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 },
	two: { flexDirection: "row", gap: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	delete: { alignItems: "center", paddingVertical: 8 },
});
