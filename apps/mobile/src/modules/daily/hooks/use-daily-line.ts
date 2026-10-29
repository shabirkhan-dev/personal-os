import { useEffect } from "react";
import { clockOf } from "@/modules/home/lib/module-day";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { saveSleep, toggleTick } from "../data/daily-actions";
import { MINIMUM } from "../lib/daily-math";
import { parseDailyLine } from "../lib/parse-daily-line";
import { dailyRoutes } from "../navigation";
import { useDailyToday } from "./use-daily";

/**
 * Handles the day's own lines typed or said on Overview: sleep ("slept 11 to 7"), ticking the
 * minimum day, "what's next" and opening a Daily screen. Returns false for anything else, so the
 * caller can route it to a module. `say` shows (and speaks, when said) the answer.
 */
export function useDailyLine(say: (text: string, spoken: boolean) => void) {
	const { data, now, today, current } = useDailyToday();
	const failed = () => say("Couldn't save on this phone. Try again.", false);

	const handle = (text: string, spoken: boolean): boolean => {
		const intent = parseDailyLine(text, data.settings.wakeAt);
		if (!intent) return false;
		if (intent.kind === "sleep") {
			const wake = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, intent.wake);
			const bed = new Date(wake);
			bed.setHours(0, intent.bed);
			if (intent.bed > intent.wake) bed.setDate(bed.getDate() - 1);
			saveSleep(bed, wake)
				.then(() => say(`Logged sleep ${clockOf(intent.bed)} to ${clockOf(intent.wake)}.`, spoken))
				.catch(failed);
		} else if (intent.kind === "tick") {
			toggleTick(today, intent.id)
				.then(() => say(`${MINIMUM[intent.id].label} ticked for today.`, spoken))
				.catch(failed);
		} else if (intent.kind === "next") {
			say(
				current
					? `${current.state === "now" ? "Now" : "Next"}: ${current.item.title} at ${clockOf(current.item.minutes)}.`
					: "Nothing else planned today. Rest counts too.",
				spoken,
			);
		} else if (intent.kind === "open") {
			dailyRoutes[intent.screen]();
		} else {
			return false;
		}
		return true;
	};

	// A line said on Talk to OS for the day itself lands here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "daily-life") return;
		const line = useAskInbox.getState().take("daily-life");
		if (line && !handle(line.text, line.spoken)) {
			say("Say which part of your day it's for, like a meal, a prayer or money spent.", false);
		}
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	return handle;
}
