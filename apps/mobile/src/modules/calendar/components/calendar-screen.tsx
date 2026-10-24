import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { useCalendar } from "../hooks/use-calendar";
import {
	type CalendarEvent,
	type CalendarItem,
	clockLabel,
	type ItemLink,
	itemsOn,
	monthGrid,
	type Source,
	SOURCE_LABELS,
	SOURCE_TONES,
} from "../lib/calendar-model";
import { EventSheet } from "./event-sheet";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Opens what a calendar item points at. */
export function openItem(link: ItemLink, onEvent: (id: string) => void): void {
	switch (link.kind) {
		case "training-plan":
			router.push({ pathname: "/training/plan", params: { template: link.template } });
			return;
		case "training-session":
			router.push({ pathname: "/training/session/[id]", params: { id: link.id } });
			return;
		case "training-program":
			router.push({ pathname: "/training/program/[id]", params: { id: link.id } });
			return;
		case "career-application":
			router.push({ pathname: "/career/application/[id]", params: { id: link.id } });
			return;
		case "finance-bills":
			router.push("/finance/budget");
			return;
		case "event":
			onEvent(link.id);
	}
}

export function ItemRow({ item, onPress }: { item: CalendarItem; onPress: () => void }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.item,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.bar, { backgroundColor: colors[item.tone] }]} />
			<View style={styles.flex}>
				<PoText
					variant="row15"
					tone={item.done ? "textSecondary" : "textPrimary"}
					numberOfLines={1}
				>
					{item.title}
				</PoText>
				{item.detail ? (
					<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
						{item.detail}
					</PoText>
				) : null}
			</View>
			<PoText variant="mono13" tone="textTertiary">
				{item.endDate
					? `until ${new Date(`${item.endDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
					: item.minutes !== undefined
						? clockLabel(item.minutes)
						: "All day"}
			</PoText>
		</Pressable>
	);
}

/**
 * The calendar for the whole app: a month of days with a dot per module that has something on
 * them, filters, the chosen day's agenda (training, interviews, bills, your events) and new events.
 */
export function CalendarScreen() {
	const { colors } = usePoTheme();
	const today = dayKey(useNow());
	const [month, setMonth] = useState(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() };
	});
	const [selected, setSelected] = useState(today);
	const [hidden, setHidden] = useState<Source[]>([]);
	const [editing, setEditing] = useState<CalendarEvent | "new" | null>(null);
	const weeks = useMemo(() => monthGrid(month.year, month.month), [month]);
	const from = weeks[0]?.[0] ?? today;
	const to = weeks.at(-1)?.[6] ?? today;
	const calendar = useCalendar(from, to);
	const visible = calendar.items.filter((item) => !hidden.includes(item.source));
	const agenda = itemsOn(visible, selected);
	const title = new Date(month.year, month.month, 1).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});

	const step = (delta: number) => {
		haptics.tap();
		setMonth((current) => {
			const date = new Date(current.year, current.month + delta, 1);
			return { year: date.getFullYear(), month: date.getMonth() };
		});
	};

	const openEvent = (id: string) =>
		setEditing(calendar.events.find((event) => event.id === id) ?? null);

	return (
		<ModuleScreen
			label="Calendar"
			onHome={() => router.dismissTo("/")}
			action={{ icon: "Line/Plus", label: "New event", onPress: () => setEditing("new") }}
		>
			<ScreenTitle eyebrow="Everything you plan" title={title}>
				<View style={styles.nav}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Previous month"
						onPress={() => step(-1)}
						style={[styles.round, { backgroundColor: colors.bgSubtle }]}
					>
						<Icon name="Filled/Back" size={16} color={colors.textPrimary} />
					</Pressable>
					<Pressable
						accessibilityRole="button"
						onPress={() => {
							const now = new Date();
							setMonth({ year: now.getFullYear(), month: now.getMonth() });
							setSelected(today);
						}}
						style={[styles.todayButton, { backgroundColor: colors.bgSubtle }]}
					>
						<PoText variant="meta13">Today</PoText>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Next month"
						onPress={() => step(1)}
						style={[styles.round, styles.flip, { backgroundColor: colors.bgSubtle }]}
					>
						<Icon name="Filled/Back" size={16} color={colors.textPrimary} />
					</Pressable>
				</View>
			</ScreenTitle>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
			>
				{calendar.sources.map((source) => (
					<FilterChip
						key={source}
						label={SOURCE_LABELS[source]}
						selected={!hidden.includes(source)}
						onPress={() =>
							setHidden((current) =>
								current.includes(source)
									? current.filter((item) => item !== source)
									: [...current, source],
							)
						}
					/>
				))}
			</ScrollView>
			<View
				style={[
					styles.grid,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<View style={styles.week}>
					{WEEKDAYS.map((letter, index) => (
						<PoText
							key={`${letter}-${index}`}
							variant="eyebrow11"
							tone="textTertiary"
							style={styles.cellLabel}
						>
							{letter}
						</PoText>
					))}
				</View>
				{weeks.map((week) => (
					<View key={week[0]} style={styles.week}>
						{week.map((day) => {
							const inMonth = Number(day.slice(5, 7)) - 1 === month.month;
							const dayItems = itemsOn(visible, day);
							// Week-long ranges (program weeks) would dot every day; only dated things get a dot.
							const tones = [
								...new Set(dayItems.filter((item) => !item.endDate).map((item) => item.source)),
							].slice(0, 4);
							const isSelected = day === selected;
							return (
								<Pressable
									key={day}
									accessibilityRole="button"
									accessibilityLabel={`${day}, ${dayItems.length} items`}
									accessibilityState={{ selected: isSelected }}
									onPress={() => {
										haptics.select();
										setSelected(day);
									}}
									style={[styles.cell, isSelected ? { backgroundColor: colors.bgSelected } : null]}
								>
									<PoText
										variant="row15"
										tone={
											day === today ? "accentDefault" : inMonth ? "textPrimary" : "textTertiary"
										}
									>
										{String(Number(day.slice(8)))}
									</PoText>
									<View style={styles.dots}>
										{tones.map((source) => (
											<View
												key={source}
												style={[styles.dot, { backgroundColor: colors[SOURCE_TONES[source]] }]}
											/>
										))}
									</View>
								</Pressable>
							);
						})}
					</View>
				))}
			</View>
			<View style={styles.agendaHead}>
				<PoText variant="title18" style={styles.flex}>
					{new Date(`${selected}T12:00:00`).toLocaleDateString("en-GB", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{agenda.length === 0
						? "Free"
						: `${agenda.length} ${agenda.length === 1 ? "thing" : "things"}`}
				</PoText>
			</View>
			{agenda.map((item) => (
				<ItemRow key={item.id} item={item} onPress={() => openItem(item.link, openEvent)} />
			))}
			{agenda.length === 0 && !calendar.loading ? (
				<PoText variant="meta13" tone="textSecondary">
					Nothing planned. Add an event, or plan training from a program.
				</PoText>
			) : null}
			<PillButton
				label="Add an event this day"
				variant="secondary"
				showPlus
				onPress={() => setEditing("new")}
			/>
			<EventSheet
				visible={editing !== null}
				event={editing === "new" ? null : editing}
				day={selected}
				onClose={() => setEditing(null)}
			/>
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	nav: { flexDirection: "row", alignItems: "center", gap: 8 },
	round: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	flip: { transform: [{ scaleX: -1 }] },
	todayButton: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: "center" },
	chips: { gap: 8, paddingVertical: 2 },
	grid: { borderRadius: 24, borderWidth: 1, padding: 8, gap: 2 },
	week: { flexDirection: "row" },
	cellLabel: { flex: 1, textAlign: "center", paddingVertical: 4 },
	cell: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 6,
		borderRadius: 12,
		gap: 3,
		minHeight: 46,
	},
	dots: { flexDirection: "row", gap: 3, height: 5 },
	dot: { width: 5, height: 5, borderRadius: 2.5 },
	agendaHead: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 14,
		borderRadius: 20,
		borderWidth: 1,
	},
	bar: { width: 3, height: 32, borderRadius: 2 },
});
