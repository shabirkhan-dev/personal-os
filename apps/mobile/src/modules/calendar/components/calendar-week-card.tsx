import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { addDays, dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { useCalendar } from "../hooks/use-calendar";
import { type CalendarEvent, itemsOn, SOURCE_TONES } from "../lib/calendar-model";
import { EventSheet } from "./event-sheet";
import { ItemRow, openItem } from "./calendar-screen";

/** Overview's calendar: the next seven days with a dot per module, and what's on the chosen day. */
export function CalendarWeekCard() {
	const { colors } = usePoTheme();
	const now = useNow();
	const today = dayKey(now);
	const days = Array.from({ length: 7 }, (_, index) => dayKey(addDays(now, index)));
	const [selected, setSelected] = useState(today);
	const [editing, setEditing] = useState<CalendarEvent | null>(null);
	const calendar = useCalendar(days[0] ?? today, days[6] ?? today);
	const agenda = itemsOn(calendar.items, selected)
		.filter((item) => !item.endDate)
		.slice(0, 4);

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<Pressable
				accessibilityRole="button"
				onPress={() => router.push("/calendar")}
				style={styles.head}
			>
				<PoText variant="title18" style={styles.flex}>
					Calendar
				</PoText>
				<PoText variant="meta13" tone="accentDefault">
					Open
				</PoText>
			</Pressable>
			<View style={styles.strip}>
				{days.map((day) => {
					const date = new Date(`${day}T12:00:00`);
					const sources = [
						...new Set(
							itemsOn(calendar.items, day)
								.filter((item) => !item.endDate)
								.map((item) => item.source),
						),
					].slice(0, 3);
					const on = day === selected;
					return (
						<Pressable
							key={day}
							accessibilityRole="button"
							accessibilityState={{ selected: on }}
							onPress={() => {
								haptics.select();
								setSelected(day);
							}}
							style={[styles.day, on ? { backgroundColor: colors.bgSelected } : null]}
						>
							<PoText variant="eyebrow11" tone="textTertiary">
								{date.toLocaleDateString("en-GB", { weekday: "narrow" })}
							</PoText>
							<PoText variant="row15" tone={day === today ? "accentDefault" : "textPrimary"}>
								{String(date.getDate())}
							</PoText>
							<View style={styles.dots}>
								{sources.map((source) => (
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
			{agenda.length === 0 ? (
				<PoText variant="meta13" tone="textSecondary">
					Nothing planned {selected === today ? "today" : "that day"}.
				</PoText>
			) : (
				agenda.map((item) => (
					<ItemRow
						key={item.id}
						item={item}
						onPress={() =>
							openItem(item.link, (id) =>
								setEditing(calendar.events.find((event) => event.id === id) ?? null),
							)
						}
					/>
				))
			)}
			<EventSheet
				visible={editing !== null}
				event={editing}
				day={selected}
				onClose={() => setEditing(null)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 16, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center" },
	flex: { flex: 1 },
	strip: { flexDirection: "row", gap: 4 },
	day: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 8, borderRadius: 14 },
	dots: { flexDirection: "row", gap: 3, height: 5 },
	dot: { width: 5, height: 5, borderRadius: 2.5 },
});
