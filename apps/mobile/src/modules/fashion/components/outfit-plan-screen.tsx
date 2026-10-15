import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { savePlan, wearLook } from "../data/fashion-actions";
import { useFashion } from "../hooks/use-fashion";
import { weekContexts } from "../hooks/use-fashion-today";
import { useWeather } from "../hooks/use-weather";
import { CLOTHES } from "../lib/fashion-math";
import type { PlanDay } from "../lib/fashion-model";
import { planWeek } from "../lib/outfits";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";
import { PieceImage } from "./piece-image";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

/** The week's outfits for the forecast: worn days as they were, the rest planned to rotate. */
export function OutfitPlanScreen() {
	const { colors } = usePoTheme();
	const data = useFashion();
	const weather = useWeather();
	const now = useNow();
	const [seed, setSeed] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const contexts = useMemo(() => weekContexts(weather.forecast, now), [weather.forecast, now]);
	const monday = contexts[0]?.day ?? dayKey(now);
	const saved = data.plans.find((plan) => plan.id === monday) ?? null;
	const today = dayKey(now);

	const proposed = useMemo(() => {
		// "Regenerate" pretends a few tops were just worn, so the engine reaches for others.
		const fresh = planWeek(
			data.pieces,
			seed === 0 ? data.wears : [...data.wears, ...fakeWears(data.pieces, seed, monday)],
			contexts,
		);
		const kept = saved && seed === 0 ? saved.days : [];
		return fresh.map((day) => {
			const worn = data.wears.find((wear) => wear.id === day.day);
			if (worn) return { day: day.day, look: worn.look, pieceIds: worn.pieceIds };
			return kept.find((item) => item.day === day.day) ?? day;
		});
	}, [contexts, data.pieces, data.wears, saved, seed, monday]);

	const byId = new Map(data.pieces.map((piece) => [piece.id, piece]));
	const used = new Set(
		proposed
			.flatMap((day) => day.pieceIds)
			.filter((id) => CLOTHES.includes(byId.get(id)?.category ?? "extra")),
	);
	const first = contexts[0]?.weather;
	const last = contexts.at(-1)?.weather;
	const [, month, date] = monday.split("-");

	const use = async () => {
		try {
			await savePlan(monday, proposed);
			haptics.success();
			setSeed(0);
			setNotice("This week is saved. Home shows each day's look.");
		} catch (error) {
			console.error("[fashion] could not save the plan", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const wearToday = async (day: PlanDay) => {
		try {
			await wearLook(day.look, day.pieceIds, now);
			haptics.success();
			setNotice(`${day.look} logged for today.`);
		} catch (error) {
			console.error("[fashion] could not log", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	if (!data.loading && proposed.length === 0) {
		return (
			<FashionScreen>
				<ScreenTitle eyebrow="This week" title="Outfit plan" />
				<EmptyCard
					icon="Filled/Calendar"
					title="Add a few pieces first"
					body="A week of looks needs at least one top and one bottom; three of each make it rotate."
				>
					<PillButton label="Add a piece" onPress={() => fashionRoutes.add()} />
				</EmptyCard>
			</FashionScreen>
		);
	}

	return (
		<FashionScreen
			action={{
				icon: "Filled/Edit",
				label: "Regenerate",
				onPress: () => setSeed((value) => value + 1),
			}}
		>
			<ScreenTitle
				eyebrow={`Week of ${Number(date)} ${MONTHS[Number(month) - 1] ?? ""}${first && last ? ` · ${first.noon}° to ${last.noon}°` : ""}`}
				title="Outfit plan"
			/>
			{proposed.map((day, index) => {
				const context = contexts.find((item) => item.day === day.day);
				const worn = data.wears.some((wear) => wear.id === day.day);
				const isToday = day.day === today;
				const open = selected === day.day;
				const clothes = day.pieceIds.flatMap((id) => {
					const piece = byId.get(id);
					return piece && CLOTHES.includes(piece.category) ? [piece] : [];
				});
				return (
					<Pressable
						key={day.day}
						accessibilityRole="button"
						accessibilityState={{ expanded: open }}
						onPress={() => {
							haptics.tap();
							setSelected(open ? null : day.day);
						}}
						style={[
							styles.row,
							{
								backgroundColor: colors.bgSurface,
								borderColor: open ? colors.accentDefault : colors.borderDefault,
								borderWidth: open ? 1.5 : 1,
							},
						]}
					>
						<View style={styles.top}>
							<View style={styles.when}>
								<PoText variant="mono13" tone={isToday ? "accentDefault" : "textSecondary"}>
									{WEEKDAYS[index]?.toUpperCase()}
								</PoText>
								<PoText variant="mono13" tone="textTertiary">
									{context?.weather ? `${context.weather.noon}°` : "—"}
								</PoText>
							</View>
							<View style={styles.thumbs}>
								{clothes.slice(0, 3).map((piece) => (
									<PieceImage
										key={piece.id}
										image={piece.image}
										category={piece.category}
										colour={piece.colour}
										size={40}
										radius={10}
									/>
								))}
							</View>
							<View style={styles.flex}>
								<PoText
									variant="row15"
									tone={worn ? "textSecondary" : "textPrimary"}
									numberOfLines={1}
								>
									{day.look}
								</PoText>
								<PoText
									variant="meta13"
									tone={open ? "accentDefault" : "textTertiary"}
									numberOfLines={1}
								>
									{open
										? clothes.map((piece) => piece.name).join(", ")
										: worn
											? "Worn"
											: isToday
												? "Today"
												: day.day < today
													? "Not logged"
													: "Planned"}
								</PoText>
							</View>
							<Icon
								name={worn ? "Line/Check" : "Line/Chevron right"}
								size={16}
								color={colors.textTertiary}
							/>
						</View>
						{open && !worn && day.day >= today ? (
							<View style={styles.actions}>
								{isToday ? (
									<PillButton
										label="Wear this today"
										onPress={() => void wearToday(day)}
										style={styles.flex}
									/>
								) : null}
								{clothes[0] ? (
									<PillButton
										label="See pieces"
										variant="secondary"
										onPress={() => clothes[0] && fashionRoutes.piece(clothes[0].id)}
										style={styles.flex}
									/>
								) : null}
							</View>
						) : null}
					</Pressable>
				);
			})}
			<View style={[styles.note, { backgroundColor: colors.bgSurface }]}>
				<Icon name="Help" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
					Built from {used.size} pieces, so a wash on Sunday keeps the whole week possible.
					{weather.forecast ? "" : " Add your location for weather-aware layers."}
				</PoText>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Regenerate"
					variant="secondary"
					onPress={() => setSeed((value) => value + 1)}
					style={styles.flex}
				/>
				<PillButton
					label={saved && seed === 0 ? "Saved" : "Use this week"}
					disabled={Boolean(saved) && seed === 0}
					onPress={() => void use()}
					style={styles.flex}
				/>
			</Footer>
		</FashionScreen>
	);
}

/** A made-up wear the day before Monday, of every third top, shifted by `seed`. */
function fakeWears(
	pieces: readonly { id: string; category: string }[],
	seed: number,
	monday: string,
) {
	const tops = pieces.filter((piece) => piece.category === "top");
	const picked = tops.filter((_, index) => (index + seed) % 3 === 0).map((piece) => piece.id);
	const before = new Date(`${monday}T12:00:00Z`);
	before.setUTCDate(before.getUTCDate() - 1);
	return [
		{ id: before.toISOString().slice(0, 10), look: "", pieceIds: picked, at: before.toISOString() },
	];
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pad: { paddingHorizontal: 6 },
	row: { gap: 12, padding: 12, borderRadius: 22 },
	top: { flexDirection: "row", alignItems: "center", gap: 10 },
	when: { width: 40, gap: 2 },
	thumbs: { flexDirection: "row", gap: 2 },
	actions: { flexDirection: "row", gap: 8 },
	note: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 20 },
});
