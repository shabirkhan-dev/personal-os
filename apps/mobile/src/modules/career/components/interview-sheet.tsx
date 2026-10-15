import { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { addDays } from "@/lib/day";
import { bookInterview } from "../data/career-actions";
import { parseTime, shortDate, startOfDay, weekdayShort } from "../lib/career-math";
import type { Application } from "../lib/career-model";
import { FilterChip } from "@/components/module-ui";

export type InterviewSheetProps = { visible: boolean; app: Application; onClose: () => void };

/** Books (or moves) an interview: a day in the next two weeks, a time, the round and its length. */
export function InterviewSheet({ visible, app, onClose }: InterviewSheetProps) {
	const [today] = useState(() => startOfDay(new Date()));
	const days = useMemo(
		() => Array.from({ length: 14 }, (_, index) => addDays(today, index)),
		[today],
	);
	const existing = app.interview ? new Date(app.interview.at) : null;
	const [day, setDay] = useState(() =>
		existing
			? Math.max(0, Math.round((startOfDay(existing).getTime() - today.getTime()) / 86_400_000))
			: 1,
	);
	const [time, setTime] = useState(
		existing ? `${existing.getHours()}:${String(existing.getMinutes()).padStart(2, "0")}` : "15:00",
	);
	const [round, setRound] = useState(app.interview?.round ?? "");
	const [minutes, setMinutes] = useState(String(app.interview?.minutes ?? 45));
	const [interviewers, setInterviewers] = useState(String(app.interview?.interviewers ?? 1));
	const [error, setError] = useState<string | null>(null);

	const save = async () => {
		const at = parseTime(time);
		const length = Number.parseInt(minutes, 10);
		const people = Number.parseInt(interviewers, 10);
		if (at === null) return setError("Write the time like 15:00 or 3 pm.");
		if (!(length > 0 && length <= 480) || !(people > 0 && people <= 20)) {
			return setError("Length and interviewers are whole numbers.");
		}
		const date = addDays(today, Math.min(day, days.length - 1));
		date.setHours(Math.floor(at / 60), at % 60, 0, 0);
		try {
			await bookInterview(app, {
				at: date.toISOString(),
				round: round.trim(),
				minutes: length,
				interviewers: people,
			});
			onClose();
		} catch (caught) {
			console.error("[career] could not book the interview", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<Sheet
			visible={visible}
			title={app.interview ? "Move interview" : "Book interview"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<PoText variant="meta13" tone="textSecondary">
				Day
			</PoText>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.days}
			>
				{days.map((date, index) => (
					<FilterChip
						key={date.toISOString()}
						label={
							index === 0
								? "Today"
								: index === 1
									? "Tomorrow"
									: `${weekdayShort(date)} ${shortDate(date)}`
						}
						selected={day === index}
						onPress={() => setDay(index)}
					/>
				))}
			</ScrollView>
			<TextField label="Time" value={time} onChangeText={setTime} placeholder="15:00" />
			<TextField
				label="Round"
				value={round}
				onChangeText={setRound}
				placeholder="Technical round"
			/>
			<TextField
				label="Length"
				value={minutes}
				onChangeText={setMinutes}
				keyboardType="number-pad"
				suffix="min"
			/>
			<TextField
				label="Interviewers"
				value={interviewers}
				onChangeText={setInterviewers}
				keyboardType="number-pad"
			/>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({ days: { gap: 8 } });
