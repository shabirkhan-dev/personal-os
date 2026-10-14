import { type BmiBand, bmi, bmiBand } from "./insights";
import type { HeightUnit, WeightUnit } from "./options";

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Who the card belongs to, kept on this device once the card is first made. */
export type Member = { number: number; since: string };

export type CardStat = { value: string; unit?: string };

export type CardStats = { height: CardStat; weight: CardStat; bmi: string; band: BmiBand };

/** Height and weight in the units the person chose, and their BMI. */
export function cardStats(input: {
	heightCm: number;
	weightKg: number;
	heightUnit: HeightUnit;
	weightUnit: WeightUnit;
}): CardStats {
	const inches = Math.round(input.heightCm / CM_PER_INCH);
	const value = bmi(input.heightCm, input.weightKg);
	return {
		height:
			input.heightUnit === "ft"
				? { value: `${Math.floor(inches / 12)}′${inches % 12}″` }
				: { value: String(Math.round(input.heightCm)), unit: "cm" },
		weight:
			input.weightUnit === "lb"
				? { value: String(Math.round(input.weightKg / KG_PER_LB)), unit: "lb" }
				: { value: String(Math.round(input.weightKg)), unit: "kg" },
		bmi: value.toFixed(1),
		band: bmiBand(value),
	};
}

/** A four-digit card number, 1000–9999. `random` is in [0, 1). */
export function newMemberNumber(random: number = Math.random()): number {
	return 1000 + Math.floor(random * 9000);
}

export function memberLabel(member: Member | null): string {
	return member ? `OS · ${String(member.number).padStart(4, "0")}` : "OS · ····";
}

export function sinceLabel(member: Member | null, today: Date = new Date()): string {
	const date = member ? new Date(member.since) : today;
	const valid = Number.isNaN(date.getTime()) ? today : date;
	return `Member since ${MONTHS[valid.getMonth()]} ${valid.getFullYear()}`;
}

/** Reads a stored member, or null when it is missing or damaged. */
export function parseMember(raw: string | null): Member | null {
	if (!raw) return null;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== "object" || value === null) return null;
		const { number, since } = value as Record<string, unknown>;
		if (typeof number !== "number" || !Number.isInteger(number) || typeof since !== "string") {
			return null;
		}
		return { number, since };
	} catch (error) {
		console.error("Stored member card is not valid JSON", error);
		return null;
	}
}
