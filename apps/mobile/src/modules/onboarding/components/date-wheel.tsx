import { StyleSheet, View } from "react-native";
import { usePoTheme } from "@/theme";
import type { Birthday } from "../lib/insights";
import { WHEEL_HEIGHT, WheelColumn } from "./wheel-column";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const BIRTH_FIRST_YEAR = 1940;
/** Youngest supported user is 13. */
const BIRTH_LAST_YEAR = new Date().getFullYear() - 13;
const BIRTH_YEARS = [BIRTH_FIRST_YEAR, BIRTH_LAST_YEAR] as const;

function daysInMonth(month: number, year: number): number {
	return new Date(year, month, 0).getDate();
}

export type DateWheelProps = {
	value: Birthday;
	onChange: (value: Birthday) => void;
	/** Years the wheel offers; birthdays by default (1940 to 13 years ago). */
	years?: readonly [first: number, last: number];
	/** What the columns are for, read out by screen readers ("Birth", "Visit"). */
	label?: string;
};

/** Date wheel: day · month · year with the selected row on a bg/hover band. */
export function DateWheel({
	value,
	onChange,
	years = BIRTH_YEARS,
	label = "Birth",
}: DateWheelProps) {
	const { colors } = usePoTheme();
	const [first, last] = years;
	const yearItems = Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
	const update = (next: Partial<Birthday>) => {
		const merged = { ...value, ...next };
		const maxDay = daysInMonth(merged.month, merged.year);
		onChange({ ...merged, day: Math.min(merged.day, maxDay) });
	};

	return (
		<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
			<View pointerEvents="none" style={[styles.band, { backgroundColor: colors.bgHover }]} />
			<WheelColumn
				items={DAYS}
				index={value.day - 1}
				onChange={(index) => update({ day: index + 1 })}
				accessibilityLabel={`${label} day`}
			/>
			<WheelColumn
				items={MONTHS}
				index={value.month - 1}
				onChange={(index) => update({ month: index + 1 })}
				accessibilityLabel={`${label} month`}
			/>
			<WheelColumn
				items={yearItems}
				index={Math.min(yearItems.length - 1, Math.max(0, value.year - first))}
				onChange={(index) => update({ year: first + index })}
				accessibilityLabel={`${label} year`}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		height: WHEEL_HEIGHT,
		flexDirection: "row",
		paddingHorizontal: 16,
		borderRadius: 20,
		overflow: "hidden",
	},
	band: { position: "absolute", left: 11, right: 11, top: 65, height: 44, borderRadius: 16 },
});
