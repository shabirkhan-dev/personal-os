import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import {
	healthCheckups,
	healthDoses,
	healthLabs,
	healthMedicines,
	healthProfile,
	healthReadings,
	healthSymptoms,
} from "../data/collections";
import {
	baseline,
	dosesOn,
	dueCheckups,
	emptyProfile,
	latest,
	onDay,
	readiness,
} from "../lib/health-model";

/** Everything Health keeps on the phone, read through React Query from the record store. */
export function useHealth() {
	const readings = useCollection(healthReadings);
	const checkups = useCollection(healthCheckups);
	const labs = useCollection(healthLabs);
	const medicines = useCollection(healthMedicines);
	const doses = useCollection(healthDoses);
	const symptoms = useCollection(healthSymptoms);
	const profile = useCollection(healthProfile);

	return useMemo(() => {
		const queries = [readings, checkups, labs, medicines, doses, symptoms, profile];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			readings: readings.data ?? [],
			checkups: checkups.data ?? [],
			labs: labs.data ?? [],
			medicines: [...(medicines.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
			doses: doses.data ?? [],
			symptoms: symptoms.data ?? [],
			profile: profile.data?.[0] ?? emptyProfile,
		};
	}, [readings, checkups, labs, medicines, doses, symptoms, profile]);
}

export type HealthData = ReturnType<typeof useHealth>;

/** Today in Health: readiness, the latest of each vital, today's doses and what's due next. */
export function useHealthToday() {
	const data = useHealth();
	const now = useNow(60_000);
	const view = useMemo(() => {
		const today = dayKey(now);
		const minuteNow = now.getHours() * 60 + now.getMinutes();
		const sleep = onDay(data.readings, "sleep", today);
		return {
			today,
			readiness: readiness({
				sleepMinutes: sleep?.value ?? null,
				restingHr: onDay(data.readings, "resting-hr", today)?.value ?? null,
				hrv: onDay(data.readings, "hrv", today)?.value ?? null,
				baselineHr: baseline(data.readings, "resting-hr", now),
				baselineHrv: baseline(data.readings, "hrv", now),
			}),
			bp: latest(data.readings, "bp"),
			sugar: latest(data.readings, "blood-sugar"),
			heart: latest(data.readings, "resting-hr") ?? latest(data.readings, "heart-rate"),
			spo2: latest(data.readings, "spo2"),
			weight: latest(data.readings, "weight"),
			steps: onDay(data.readings, "steps", today),
			doses: dosesOn(data.medicines, data.doses, today, minuteNow, today),
			due: dueCheckups(data.checkups, today),
		};
	}, [data, now]);
	return { data, now, ...view };
}
