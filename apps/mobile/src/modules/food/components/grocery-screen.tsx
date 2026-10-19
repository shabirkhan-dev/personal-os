import { Pressable, Share, StyleSheet, View } from "react-native";
import { EmptyCard, Footer, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { monthShort } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { saveGroceryItems } from "../data/food-actions";
import { useFoodToday } from "../hooks/use-food";
import { groceryTotal } from "../lib/food-math";
import { GROCERY_SECTIONS, type GroceryItem, SECTION_LABELS } from "../lib/food-model";
import { foodRoutes } from "../navigation";
import { Card } from "./home-cards";
import { FoodScreen } from "./food-screen";

const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Grocery list: what the plan needs, by section, against the weekly food budget. */
export function GroceryScreen() {
	const { data, weekId, today, plan } = useFoodToday();
	const list =
		data.groceries.find((item) => item.id === weekId) ??
		[...data.groceries].sort((a, b) => b.id.localeCompare(a.id))[0] ??
		null;
	const budget = data.settings.weeklyBudget;

	if (!list) {
		return (
			<FoodScreen>
				<ScreenTitle eyebrow="Shopping" title="Grocery list" />
				<EmptyCard
					icon="Tag"
					title="No list yet"
					body="Plan the week first, then make the list from it: whole packs, rough prices and what you already have."
				>
					<PillButton label={plan ? "Open meal plan" : "Plan the week"} onPress={foodRoutes.plan} />
				</EmptyCard>
			</FoodScreen>
		);
	}

	const total = groceryTotal(list.items);
	const atHome = list.items.filter((item) => item.atHome).length;
	const days = (plan?.days ?? []).filter((day) => day.day >= today && day.meals.length > 0);
	const from = days[0] ? new Date(`${days[0].day}T12:00:00`) : null;
	const to = days.at(-1) ? new Date(`${days.at(-1)?.day}T12:00:00`) : null;

	const update = (items: GroceryItem[]) => {
		saveGroceryItems(list, items).catch((error: unknown) =>
			console.error("[food] could not save the list", error),
		);
	};
	const toggle = (id: string, key: "bought" | "atHome") => {
		haptics.select();
		update(list.items.map((item) => (item.id === id ? { ...item, [key]: !item[key] } : item)));
	};

	const share = () => {
		const lines = GROCERY_SECTIONS.flatMap((section) => {
			const items = list.items.filter(
				(item) => item.section === section && !item.atHome && !item.bought,
			);
			return items.length
				? [
						`${SECTION_LABELS[section]}:`,
						...items.map((item) => `• ${item.name}, ${item.amount}`),
						"",
					]
				: [];
		});
		void Share.share({ message: ["Grocery list", "", ...lines].join("\n").trim() }).catch(
			(error: unknown) => console.error("[food] could not share the list", error),
		);
	};

	return (
		<FoodScreen action={{ icon: "Filled/Share", label: "Share list", onPress: share }}>
			<ScreenTitle
				eyebrow={
					from && to
						? `For ${WEEKDAYS[from.getDay()]} to ${WEEKDAYS[to.getDay()]} · ${days.length} days`
						: `Week of ${new Date(`${list.id}T12:00:00`).getDate()} ${monthShort(new Date(`${list.id}T12:00:00`))}`
				}
				title="Grocery list"
			/>
			<Card>
				<PoText variant="title18">
					{money(total)}
					<PoText variant="meta13" tone="textSecondary">
						{`  of ${money(budget)} food budget`}
					</PoText>
				</PoText>
				<ProgressBar
					share={budget > 0 ? total / budget : 1}
					tone={total > budget ? "statusDanger" : "statusSuccess"}
				/>
				<PoText variant="meta13" tone={total > budget ? "textDanger" : "textSuccess"}>
					{`${total > budget ? `${money(total - budget)} over` : `${money(budget - total)} left`}${atHome ? ` · ${atHome} item${atHome === 1 ? "" : "s"} already at home` : ""}`}
				</PoText>
			</Card>
			{GROCERY_SECTIONS.map((section) => {
				const items = list.items.filter((item) => item.section === section);
				if (items.length === 0) return null;
				const sectionTotal = groceryTotal(items);
				return (
					<Card key={section}>
						<View style={styles.head}>
							<PoText variant="title18" style={styles.flex}>
								{SECTION_LABELS[section]}
							</PoText>
							<PoText variant="mono13" tone="textTertiary">
								{money(sectionTotal)}
							</PoText>
						</View>
						{items.map((item) => (
							<Pressable
								key={item.id}
								accessibilityRole="checkbox"
								accessibilityState={{ checked: item.bought }}
								accessibilityHint="Long press to mark it as already at home"
								onPress={() => toggle(item.id, "bought")}
								onLongPress={() => toggle(item.id, "atHome")}
								style={({ pressed }) => [styles.row, pressed ? { opacity: 0.7 } : null]}
							>
								<Checkbox checked={item.bought} />
								<PoText
									variant="row15"
									tone={item.atHome ? "textTertiary" : "textPrimary"}
									style={styles.flex}
								>
									{item.name}
								</PoText>
								<PoText variant="mono13" tone="textTertiary">
									{item.amount}
								</PoText>
								<PoText
									variant="meta13"
									tone={item.atHome ? "textSuccess" : "textSecondary"}
									style={styles.price}
								>
									{item.atHome ? "At home" : money(item.price)}
								</PoText>
							</Pressable>
						))}
					</Card>
				);
			})}
			<PoText variant="meta13" tone="textTertiary" style={styles.hint}>
				Tap to tick off. Long press for things you already have. Prices are rough.
			</PoText>
			<Footer>
				<PillButton label="Share list" variant="secondary" style={styles.flex} onPress={share} />
				<PillButton
					label="Mark all bought"
					style={styles.flex}
					onPress={() => {
						haptics.success();
						const items = list.items.map((item) => Object.assign({}, item));
						for (const item of items) item.bought ||= !item.atHome;
						update(items);
					}}
				/>
			</Footer>
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	head: { flexDirection: "row", alignItems: "center" },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	price: { minWidth: 70, textAlign: "right" },
	hint: { paddingHorizontal: 6 },
});
