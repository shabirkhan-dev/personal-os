import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Footer, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useFoodWater } from "@/modules/food";
import { usePoTheme } from "@/theme";
import { deleteHabit, logCare, saveHabit, tick, toggleHabit } from "../data/care-actions";
import { useCareToday } from "../hooks/use-care";
import { lastDone, ratingWord, stepsOn, weekdayName } from "../lib/care-math";
import type { CheckIn, Habit, Metric } from "../lib/care-model";
import { CareScreen } from "./care-screen";
import { Card, CardHead } from "./home-cards";
import { ProductImage } from "./product-image";

type AreaRow = { name: string; metrics: Metric[]; issue: string; care: string };

const AREA_ROWS: readonly AreaRow[] = [
	{
		name: "Neck and arms",
		metrics: ["tan", "dark-spots"],
		issue: "Tan and dark spots",
		care: "SPF daily · lotion at night",
	},
	{
		name: "Back",
		metrics: ["dark-spots"],
		issue: "Dark spots",
		care: "Body lotion · loose cotton in summer",
	},
	{
		name: "Elbows and shins",
		metrics: ["face-dryness"],
		issue: "Dry patches",
		care: "Thicker lotion after shower",
	},
	{
		name: "Hands and nails",
		metrics: ["nails"],
		issue: "Trim weekly",
		care: "File, cuticles, cream",
	},
];

function areaState(row: AreaRow, checkIn: CheckIn | null) {
	const values = row.metrics.flatMap((metric) => {
		const value = checkIn?.ratings[metric];
		return value ? [value] : [];
	});
	if (values.length === 0)
		return { share: 0.5, tone: "textSecondary" as const, bar: "borderStrong" as const };
	const worst = Math.max(...values);
	const tone = ratingWord(worst).tone;
	return {
		share: (5 - worst) / 4 || 0.08,
		tone,
		bar:
			tone === "textSuccess"
				? ("statusSuccess" as const)
				: tone === "textLink"
					? ("accentDefault" as const)
					: ("statusCaution" as const),
	};
}

/** Body and nails: areas below the neck, the nail day and the small daily habits. */
export function BodyScreen() {
	const { colors } = usePoTheme();
	const { data, today, record, now } = useCareToday();
	const { steps, products, habits, days } = data;
	const water = useFoodWater();
	const [adding, setAdding] = useState<{ name: string; detail: string } | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const latest = data.checkIns.at(-1) ?? null;
	const nail = steps.find((step) => /nail/i.test(step.name));
	const nailAgo = nail ? lastDone(nail.id, days, now) : null;
	const nailKit = products.find((product) => product.id === nail?.productId);
	const waterDone = water.targetMl > 0 && water.ml >= water.targetMl;
	const isDone = (habit: Habit) =>
		habit.link === "water" ? waterDone : (record?.habits.includes(habit.id) ?? false);
	const doneCount = habits.filter(isDone).length;

	const failed = (what: string) => (error: unknown) => {
		console.error(`[care] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const toggle = (habit: Habit) => {
		if (habit.link === "water") return;
		haptics.select();
		toggleHabit(today, habit.id).catch(failed("tick the habit"));
	};

	return (
		<CareScreen>
			<ScreenTitle eyebrow="Skin below the neck · hands · teeth" title="Body and nails" />
			<Card>
				<CardHead title="Your areas" right={latest ? `from ${latest.id.slice(5)}` : "4 in focus"} />
				{AREA_ROWS.map((row) => {
					const state = areaState(row, latest);
					return (
						<View key={row.name} style={styles.area}>
							<View style={styles.areaHead}>
								<PoText variant="row15" style={styles.flex}>
									{row.name}
								</PoText>
								<PoText
									variant="meta13"
									tone={state.tone === "textSecondary" ? "textTertiary" : state.tone}
								>
									{row.issue}
								</PoText>
							</View>
							<ProgressBar share={state.share} tone={state.bar} />
							<PoText variant="meta13" tone="textSecondary">
								{row.care}
							</PoText>
						</View>
					);
				})}
			</Card>

			{nail ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Log nail day"
					onPress={() => {
						haptics.tap();
						void tick(today, nail, stepsOn(steps, nail.routine, today)).catch(failed("log nails"));
					}}
					style={[
						styles.nail,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<ProductImage photo={nailKit?.photo ?? "catalog:nail-kit"} size={72} radius={16} />
					<View style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{`Nail day · ${weekdayName(nail.days[0] ?? 0)}`}
						</PoText>
						<PoText variant="row15">{nail.detail || "Trim, file, push cuticles"}</PoText>
						<PoText
							variant="meta13"
							tone={nailAgo !== null && nailAgo <= 7 ? "textSuccess" : "textWarning"}
						>
							{nailAgo === null
								? `Not logged yet · ${nail.minutes} min · tap when done`
								: nailAgo === 0
									? "Done today"
									: `Last done ${nailAgo} day${nailAgo === 1 ? "" : "s"} ago · ${nail.minutes} min`}
						</PoText>
					</View>
				</Pressable>
			) : null}

			<Card>
				<CardHead title="Every day" right={`${doneCount} of ${habits.length}`} />
				{habits.map((habit) => {
					const done = isDone(habit);
					return (
						<Pressable
							key={habit.id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: done, disabled: habit.link === "water" }}
							onPress={() => toggle(habit)}
							onLongPress={() => {
								if (habit.link !== "water")
									void deleteHabit(habit).catch(failed("remove the habit"));
							}}
							style={styles.habit}
						>
							<Checkbox checked={done} />
							<View style={styles.flex}>
								<PoText variant="row15" tone={done ? "textSecondary" : "textPrimary"}>
									{habit.name}
								</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{habit.link === "water"
										? `Shared with Food · ${(water.ml / 1000).toFixed(1)} of ${(water.targetMl / 1000).toFixed(1)} L`
										: habit.detail}
								</PoText>
							</View>
						</Pressable>
					);
				})}
				<PoText variant="meta13" tone="textTertiary">
					Long press a habit to remove it. Water ticks itself from Food.
				</PoText>
			</Card>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Add a habit"
					variant="secondary"
					style={styles.flex}
					onPress={() => setAdding({ name: "", detail: "" })}
				/>
				<PillButton
					label="Log today"
					style={styles.flex}
					onPress={() => {
						const all = habits.filter((habit) => habit.link !== "water").map((habit) => habit.id);
						logCare(today, { habitIds: all })
							.then(() => haptics.success())
							.catch(failed("log today"));
					}}
				/>
			</Footer>

			<Sheet
				visible={adding !== null}
				title="Add a habit"
				onClose={() => setAdding(null)}
				action={{
					label: "Add",
					onPress: () => {
						const name = adding?.name.trim();
						if (!name) return;
						void saveHabit({
							name,
							detail: adding?.detail.trim() ?? "",
							link: null,
							order: habits.length,
						}).catch(failed("add the habit"));
						setAdding(null);
					},
				}}
			>
				{adding ? (
					<View style={styles.sheet}>
						<TextField
							label="Habit"
							value={adding.name}
							onChangeText={(name) => setAdding({ ...adding, name })}
							placeholder="Deodorant after shower"
						/>
						<TextField
							label="Note"
							value={adding.detail}
							onChangeText={(detail) => setAdding({ ...adding, detail })}
							placeholder="Every morning"
						/>
					</View>
				) : null}
			</Sheet>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	area: { gap: 6, paddingVertical: 6 },
	areaHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	nail: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 14,
		borderRadius: 28,
		borderWidth: 1,
	},
	habit: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	sheet: { gap: 12 },
});
