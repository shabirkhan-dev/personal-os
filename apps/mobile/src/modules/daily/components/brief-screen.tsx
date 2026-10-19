import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { PieceImage, useFashionDay } from "@/modules/fashion";
import { useFaithPlace } from "@/modules/faith";
import { MealImage } from "@/modules/food";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { markBrief } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import {
	hoursLabel,
	MINIMUM,
	minimumState,
	minimumTitle,
	sleepWord,
	sleptMinutes,
} from "../lib/daily-math";
import { dailyRoutes } from "../navigation";
import { Card, CardHead, MODULE_TONES } from "./daily-cards";
import { DailyScreen } from "./daily-screen";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function greeting(hour: number): string {
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

/** Morning brief: last night, the numbers that matter, today's three, and what's ready to wear and eat. */
export function BriefScreen() {
	const { colors } = usePoTheme();
	const { data, sources, now, today, log, agenda } = useDailyToday();
	const place = useFaithPlace();
	const fashion = useFashionDay();
	const { faith, food, career } = sources.extra;
	const lastNight = data.sleep.find((item) => item.id === today) ?? null;
	const slept = lastNight ? sleptMinutes(lastNight) : null;

	const status: {
		label: string;
		value: string;
		tone: "textSuccess" | "textWarning" | "textDanger" | "textPrimary" | "textSecondary";
	}[] = [];
	if (sources.faith && faith.fajr) {
		status.push(
			faith.fajr.prayedAt
				? {
						label: "Fajr",
						value: `Prayed ${clockOf(new Date(faith.fajr.prayedAt).getHours() * 60 + new Date(faith.fajr.prayedAt).getMinutes())} ✓`,
						tone: "textSuccess",
					}
				: { label: "Fajr", value: `At ${clockOf(faith.fajr.minutes)}`, tone: "textSecondary" },
		);
	}
	if (slept !== null) {
		const word = sleepWord(slept, data.settings.sleepTarget);
		status.push({ label: "Sleep", value: `${hoursLabel(slept)} · ${word.word}`, tone: word.tone });
	} else {
		status.push({ label: "Sleep", value: "Not logged", tone: "textSecondary" });
	}
	if (sources.food && food.weight) {
		const week = food.weight.week;
		status.push({
			label: "Weight",
			value: `${food.weight.kg.toFixed(1)} kg${week === null ? "" : ` · ${week >= 0 ? "+" : ""}${week.toFixed(1)} this week`}`,
			tone: "textSuccess",
		});
	}
	if (sources.career && career.runwayWeeks !== null) {
		status.push({ label: "Runway", value: `${career.runwayWeeks * 7} days`, tone: "textPrimary" });
	}

	// Today's three: the minimum-day items still open, with when they happen.
	const three = data.settings.minimum
		.filter((id) => !minimumState(id, sources, log).done)
		.slice(0, 3)
		.map((id) => {
			const owner = MINIMUM[id].module;
			const when = agenda.find((item) => item.module === owner && !item.done);
			return {
				id,
				module: owner,
				title: minimumTitle(id, sources, data.settings),
				detail: when ? `${when.title} · ${clockOf(when.minutes)}` : "Any time today",
			};
		});

	const start = () => {
		markBrief(today)
			.then(() => haptics.success())
			.catch((error: unknown) => console.error("[daily] could not mark the brief", error));
		router.back();
	};

	return (
		<DailyScreen action={{ icon: "Filled/Edit", label: "Plan the day", onPress: dailyRoutes.plan }}>
			<ScreenTitle
				eyebrow={`${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} · ${clockOf(now.getHours() * 60 + now.getMinutes())}${place?.name ? ` · ${place.name}` : ""}${fashion.weather ? ` ${fashion.weather.split(" ")[0]}` : ""}`}
				title={greeting(now.getHours())}
			/>
			<Card>
				{status.map((row) => (
					<View key={row.label} style={styles.status}>
						<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
							{row.label}
						</PoText>
						<PoText variant="row15" tone={row.tone}>
							{row.value}
						</PoText>
					</View>
				))}
			</Card>
			{three.length > 0 ? (
				<Card>
					<CardHead title="Today's three" right="from your modules" rightTone="textTertiary" />
					{three.map((item) => (
						<View key={item.id} style={styles.three}>
							<View style={[styles.bar, { backgroundColor: colors[MODULE_TONES[item.module]] }]} />
							<View style={styles.flex}>
								<PoText variant="row15">{item.title}</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{item.detail}
								</PoText>
							</View>
						</View>
					))}
				</Card>
			) : (
				<Card tone="success">
					<PoText variant="row15" tone="textSuccess">
						Minimum day already kept. Anything else today is a bonus.
					</PoText>
				</Card>
			)}
			{fashion.look || food.breakfast ? (
				<Card>
					<CardHead title="Ready for you" />
					<View style={styles.ready}>
						{fashion.look ? (
							<View style={styles.readyItem}>
								{fashion.look.piece ? (
									<PieceImage
										image={fashion.look.piece.image}
										category={fashion.look.piece.category}
										colour={fashion.look.piece.colour}
										size={110}
										fill
										radius={18}
									/>
								) : null}
								<PoText variant="row15">{fashion.look.name}</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{fashion.weather ?? (fashion.look.worn ? "Wearing today" : "Today's look")}
								</PoText>
							</View>
						) : null}
						{food.breakfast ? (
							<View style={styles.readyItem}>
								<MealImage recipeId={food.breakfast.recipeId} size={110} fill radius={18} />
								<PoText variant="row15" numberOfLines={1}>
									{food.breakfast.title.charAt(0).toUpperCase() + food.breakfast.title.slice(1)}
								</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{`${Math.round(food.breakfast.kcal)} kcal${food.breakfast.protein ? ` · ${food.breakfast.protein} g protein` : ""}`}
								</PoText>
							</View>
						) : null}
					</View>
				</Card>
			) : null}
			{sources.faith ? (
				<Card>
					<PoText variant="eyebrow11" tone="textTertiary">
						Morning reminder · Faith
					</PoText>
					<PoText variant="row15">{`“${faith.ayah.text}” · ${faith.ayah.ref}`}</PoText>
				</Card>
			) : null}
			<Footer>
				<PillButton
					label="Adjust"
					variant="secondary"
					style={styles.flex}
					onPress={dailyRoutes.plan}
				/>
				<PillButton label="Start the day" style={styles.flex} onPress={start} />
			</Footer>
		</DailyScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	status: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	three: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
	bar: { width: 3, height: 32, borderRadius: 2 },
	ready: { flexDirection: "row", gap: 10 },
	readyItem: { flex: 1, gap: 4 },
});
