import { useMemo, useState } from "react";
import { ageFromBirthday, bmi, bmiBand, dailyCalories, dayRhythm } from "../lib/insights";
import type { PlanInput } from "../lib/plan";
import { useOnboardingStore } from "./onboarding-store";

/** Derived plan inputs and the profile facts shown on the personal card. */
export function usePlan() {
	const answers = useOnboardingStore();
	const [today] = useState(() => new Date());

	return useMemo(() => {
		const age = ageFromBirthday(answers.birthday, today);
		const calories = dailyCalories({
			weightKg: answers.weightKg,
			heightCm: answers.heightCm,
			age,
			gender: answers.gender,
			loseWeight: answers.goals.includes("lose-weight"),
		});
		const input: PlanInput = {
			wakeMinutes: answers.wakeMinutes,
			bedMinutes: answers.bedMinutes,
			workStartMinutes: answers.workStartMinutes,
			workEndMinutes: answers.workEndMinutes,
			workStyle: answers.workStyle,
			workdays: answers.workdays,
			modules: answers.modules,
			weightKg: answers.weightKg,
			calories,
		};
		const answered = [
			answers.name.trim().length > 0,
			answers.gender !== null,
			true,
			true,
			true,
			answers.goals.length > 0,
			answers.modules.length > 0,
			answers.appleHealth || Object.values(answers.connections).some(Boolean),
		];
		const bmiValue = bmi(answers.heightCm, answers.weightKg);
		return {
			answers,
			today,
			age,
			calories,
			input,
			bmi: bmiValue,
			bmiBand: bmiBand(bmiValue),
			rhythm: dayRhythm(answers.wakeMinutes, answers.bedMinutes),
			/** Share of profile questions answered, for the completeness ring. */
			completeness: answered.filter(Boolean).length / answered.length,
		};
	}, [answers, today]);
}
