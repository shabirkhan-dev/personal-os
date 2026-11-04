import {
	inRange,
	type ReadingKind,
	SYMPTOM_LABELS,
	type SugarContext,
	SYMPTOMS,
	type SymptomKind,
} from "./health-model";

export type HealthIntent =
	| {
			kind: "reading";
			reading: ReadingKind;
			value: number;
			value2: number | null;
			context: SugarContext | null;
	  }
	| { kind: "took"; medicine: string }
	| { kind: "symptom"; symptom: SymptomKind; severity: 1 | 2 | 3 };

const NUMBER = "(\\d{1,3}(?:[.,]\\d)?)";
const num = (text: string) => Number(text.replace(",", "."));

const SYMPTOM_WORDS: [SymptomKind, RegExp][] = [
	["headache", /\b(headache|migraine|head hurts)\b/],
	["tired", /\b(tired|exhausted|no energy|fatigue)\b/],
	["stress", /\b(stress(ed)?|anxious|anxiety)\b/],
	["low-mood", /\b(sad|low mood|down|depressed)\b/],
	["cold", /\b(cold|flu|sore throat|cough|runny nose)\b/],
	["fever", /\b(fever|feverish)\b/],
	["stomach", /\b(stomach|nausea|acidity|diarrh?oea|upset stomach)\b/],
	["back-pain", /\b(back pain|back hurts|backache)\b/],
	["joint-pain", /\b(joint pain|knee pain|knees? hurts?)\b/],
	["dizzy", /\b(dizzy|dizziness|light ?headed)\b/],
];

/**
 * Reads a typed or spoken health line: "bp 120/80", "sugar 95 fasting", "heart rate 64",
 * "spo2 97", "temp 37.8", "weight 72.5", "took metformin", "bad headache". Null when it isn't one.
 */
export function parseHealthLine(raw: string): HealthIntent | null {
	const text = raw.toLowerCase().trim();
	if (!text) return null;

	const bp = new RegExp(
		`\\b(?:bp|blood pressure|pressure)?\\s*(\\d{2,3})\\s*(?:/|over)\\s*(\\d{2,3})\\b`,
	).exec(text);
	if (bp && (/\b(bp|blood pressure|pressure)\b/.test(text) || /\d\s*\/\s*\d/.test(text))) {
		const systolic = Number(bp[1]);
		const diastolic = Number(bp[2]);
		if (inRange("bp", systolic) && diastolic >= 30 && diastolic < systolic) {
			return { kind: "reading", reading: "bp", value: systolic, value2: diastolic, context: null };
		}
	}

	const measures: [ReadingKind, RegExp][] = [
		["blood-sugar", new RegExp(`\\b(?:sugar|glucose|bsl)\\b[^\\d]*${NUMBER}`)],
		["spo2", new RegExp(`\\b(?:spo2|oxygen|o2|sats?)\\b[^\\d]*${NUMBER}`)],
		["temperature", new RegExp(`\\b(?:temp|temperature|fever of)\\b[^\\d]*${NUMBER}`)],
		["resting-hr", new RegExp(`\\b(?:resting (?:hr|heart rate)|rhr)\\b[^\\d]*${NUMBER}`)],
		["heart-rate", new RegExp(`\\b(?:hr|heart rate|pulse|bpm)\\b[^\\d]*${NUMBER}`)],
		["hrv", new RegExp(`\\bhrv\\b[^\\d]*${NUMBER}`)],
		["weight", new RegExp(`\\b(?:weight|weigh(?:ed)?)\\b[^\\d]*${NUMBER}`)],
	];
	for (const [reading, pattern] of measures) {
		const match = pattern.exec(text);
		if (!match?.[1]) continue;
		let value = num(match[1]);
		// "temp 100.4" is Fahrenheit.
		if (reading === "temperature" && value > 45) value = Math.round(((value - 32) * 50) / 9) / 10;
		if (!inRange(reading, value)) continue;
		const context: SugarContext | null =
			reading !== "blood-sugar"
				? null
				: /\b(fasting|empty stomach|before breakfast)\b/.test(text)
					? "fasting"
					: /\b(after (?:a )?(?:meal|eating|lunch|dinner|breakfast)|post ?meal)\b/.test(text)
						? "after-meal"
						: "random";
		return { kind: "reading", reading, value, value2: null, context };
	}

	const steps = /\b(\d{3,6})\s*steps\b/.exec(text);
	if (steps?.[1])
		return {
			kind: "reading",
			reading: "steps",
			value: Number(steps[1]),
			value2: null,
			context: null,
		};

	const took =
		/\b(?:took|taken|had)\s+(?:my\s+)?([a-z][a-z0-9 -]{1,40}?)(?:\s+(?:tablet|pill|dose|medicine))?\s*$/.exec(
			text,
		);
	if (took?.[1] && !/\b(breakfast|lunch|dinner|meal|water|shower|nap)\b/.test(took[1])) {
		return { kind: "took", medicine: took[1].trim() };
	}

	for (const [symptom, pattern] of SYMPTOM_WORDS) {
		if (!pattern.test(text)) continue;
		const severity = /\b(bad|terrible|awful|severe|really)\b/.test(text)
			? 3
			: /\b(slight|mild|little|bit)\b/.test(text)
				? 1
				: 2;
		return { kind: "symptom", symptom, severity };
	}
	return null;
}

/** "Headache", for the confirmation line. */
export const symptomLabel = (kind: SymptomKind) => SYMPTOM_LABELS[kind];
export const KNOWN_SYMPTOMS = SYMPTOMS;
