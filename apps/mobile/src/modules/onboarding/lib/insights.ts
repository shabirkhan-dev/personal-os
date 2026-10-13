import { formatClock, formatDuration, sleepMinutes } from "./time";

export type Birthday = { day: number; month: number; year: number };

/** Whole years between a birthday (month is 1-based) and `today`. */
export function ageFromBirthday(birthday: Birthday, today: Date): number {
	let age = today.getFullYear() - birthday.year;
	const month = today.getMonth() + 1;
	if (month < birthday.month || (month === birthday.month && today.getDate() < birthday.day)) {
		age -= 1;
	}
	return Math.max(0, age);
}

export type BmiBand = "underweight" | "healthy" | "overweight" | "obese";

/** Body-mass index rounded to one decimal. */
export function bmi(heightCm: number, weightKg: number): number {
	const meters = heightCm / 100;
	if (meters <= 0) return 0;
	return Math.round((weightKg / (meters * meters)) * 10) / 10;
}

export function bmiBand(value: number): BmiBand {
	if (value < 18.5) return "underweight";
	if (value < 25) return "healthy";
	if (value < 30) return "overweight";
	return "obese";
}

/** Daily water goal: 35 ml per kg, rounded to the nearest 0.5 L. */
export function waterGoalLiters(weightKg: number): number {
	return Math.round(weightKg * 0.035 * 2) / 2;
}

export type DayRhythm = {
	sleep: string;
	morningPlan: string;
	checkIn: string;
};

/** Sleep length plus the morning-plan (wake + 15m) and check-in (bed − 30m) times. */
export function dayRhythm(wakeMinutes: number, bedMinutes: number): DayRhythm {
	return {
		sleep: formatDuration(sleepMinutes(bedMinutes, wakeMinutes)),
		morningPlan: formatClock(wakeMinutes + 15),
		checkIn: formatClock(bedMinutes - 30),
	};
}

export type InsightChip = {
	id: "age" | "bmi" | "water" | "sleep";
	label: string;
	value: string;
};

export type InsightInput = {
	birthday: Birthday;
	heightCm: number;
	weightKg: number;
	wakeMinutes: number;
	bedMinutes: number;
};

/** The four insight chips computed from the onboarding answers. */
export function insightChips(input: InsightInput, today: Date): InsightChip[] {
	const bmiValue = bmi(input.heightCm, input.weightKg);
	return [
		{ id: "age", label: "Age", value: `${ageFromBirthday(input.birthday, today)} years` },
		{ id: "bmi", label: "BMI", value: bmiValue.toFixed(1) },
		{ id: "water", label: "Water", value: `${waterGoalLiters(input.weightKg).toFixed(1)} L` },
		{ id: "sleep", label: "Sleep", value: dayRhythm(input.wakeMinutes, input.bedMinutes).sleep },
	];
}

export type CalorieInput = {
	weightKg: number;
	heightCm: number;
	age: number;
	gender: "male" | "female" | "other" | null;
	loseWeight: boolean;
};

/**
 * Daily calorie target: Mifflin–St Jeor BMR × 1.35 (lightly active), minus 300 kcal when
 * losing weight, rounded to the nearest 50.
 */
export function dailyCalories({
	weightKg,
	heightCm,
	age,
	gender,
	loseWeight,
}: CalorieInput): number {
	const sexOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
	const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
	const target = bmr * 1.35 - (loseWeight ? 300 : 0);
	return Math.round(target / 50) * 50;
}

/** "8,000" style grouping without relying on Intl being present on every engine. */
export function formatThousands(value: number): string {
	return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
