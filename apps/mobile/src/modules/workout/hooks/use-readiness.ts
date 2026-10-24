import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { sleepLogs } from "@/modules/daily/data/collections";
import { sleptMinutes } from "@/modules/daily/lib/daily-math";
import { type Readiness, readiness } from "../lib/stats";
import type { Session } from "../lib/training-model";

/** Today's readiness: last night's sleep from Daily life (when logged) and recent training. */
export function useReadiness(sessions: readonly Session[], now: Date): Readiness {
	const sleep = useCollection(sleepLogs);
	const today = dayKey(now);
	const lastNight = sleep.data?.find((log) => log.id === today) ?? null;
	return useMemo(
		() => readiness({ sleptMinutes: lastNight ? sleptMinutes(lastNight) : null, sessions, now }),
		[lastNight, sessions, now],
	);
}
