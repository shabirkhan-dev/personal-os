import { StyleSheet, View } from "react-native";
import { usePoTheme } from "@/theme";
import type { Birthday } from "../lib/insights";
import { WHEEL_HEIGHT, WheelColumn } from "./wheel-column";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const FIRST_YEAR = 1940;
/** Youngest supported user is 13. */
const LAST_YEAR = new Date().getFullYear() - 13;
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) =>
	String(FIRST_YEAR + index),
);

function daysInMonth(month: number, year: number): number {
	return new Date(year, month, 0).getDate();
}

export type DateWheelProps = { value: Birthday; onChange: (value: Birthday) => void };

/** Birthday wheel: day · month · year with the selected row on a bg/hover band. */
export function DateWheel({ value, onChange }: DateWheelProps) {
	const { colors } = usePoTheme();
	const update = (next: Partial<Birthday>) => {
		const merged = { ...value, ...next };
		const maxDay = daysInMonth(merged.month, merged.year);
		onChange({ ...merged, day: Math.min(merged.day, maxDay) });
	};

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View pointerEvents="none" style={[styles.band, { backgroundColor: colors.bgHover }]} />
			<WheelColumn
				items={DAYS}
				index={value.day - 1}
				onChange={(index) => update({ day: index + 1 })}
				accessibilityLabel="Birth day"
			/>
			<WheelColumn
				items={MONTHS}
				index={value.month - 1}
				onChange={(index) => update({ month: index + 1 })}
				accessibilityLabel="Birth month"
			/>
			<WheelColumn
				items={YEARS}
				index={Math.max(0, value.year - FIRST_YEAR)}
				onChange={(index) => update({ year: FIRST_YEAR + index })}
				accessibilityLabel="Birth year"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		height: WHEEL_HEIGHT,
		flexDirection: "row",
		paddingHorizontal: 14,
		borderRadius: 28,
		borderWidth: 1,
		overflow: "hidden",
	},
	band: { position: "absolute", left: 11, right: 11, top: 65, height: 44, borderRadius: 16 },
});
