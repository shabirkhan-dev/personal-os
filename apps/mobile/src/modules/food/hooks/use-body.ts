import { useMemo } from "react";
import { useNow } from "@/lib/use-now";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { ACTIVITY_LABELS, ageOn, type Body } from "../lib/targets";
import type { Activity } from "../lib/food-model";

/** The body numbers onboarding asked for, as Food's targets need them. */
export function useBody(): Body {
	const weightKg = useOnboardingStore((state) => state.weightKg);
	const heightCm = useOnboardingStore((state) => state.heightCm);
	const birthday = useOnboardingStore((state) => state.birthday);
	const gender = useOnboardingStore((state) => state.gender);
	const now = useNow(3_600_000);
	return useMemo(
		() => ({
			weightKg,
			heightCm,
			age: ageOn(birthday, now),
			sex: gender === "male" || gender === "female" ? gender : null,
		}),
		[weightKg, heightCm, birthday, gender, now],
	);
}

/** "From 65 kg · 180 cm · 26 · active most days". */
export function bodyLine(body: Body, activity: Activity): string {
	return `From ${Math.round(body.weightKg)} kg · ${Math.round(body.heightCm)} cm · ${body.age} · ${ACTIVITY_LABELS[activity]}`;
}
