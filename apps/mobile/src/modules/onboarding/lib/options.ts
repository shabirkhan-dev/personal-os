import type { ColorTokens } from "@personal-os/tokens";
import type { IconName } from "@/components/icons";

type Tone = keyof ColorTokens;

export type GoalId =
	| "lose-weight"
	| "build-muscle"
	| "save-money"
	| "clear-skin"
	| "sleep-better"
	| "eat-healthy"
	| "stay-organized"
	| "less-stress";

export type GoalOption = {
	id: GoalId;
	label: string;
	/** Short phrase used in the "Plan built around" sentence. */
	focus: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
};

export const goalOptions: readonly GoalOption[] = [
	{
		id: "lose-weight",
		label: "Lose weight",
		focus: "weight",
		icon: "Dumbbell",
		iconTone: "statusDanger",
		tileTone: "bgSubtle",
	},
	{
		id: "build-muscle",
		label: "Build muscle",
		focus: "strength",
		icon: "Lightning",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
	},
	{
		id: "save-money",
		label: "Save money",
		focus: "savings",
		icon: "Wallet",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
	},
	{
		id: "clear-skin",
		label: "Clear skin",
		focus: "skin",
		icon: "Drop",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
	},
	{
		id: "sleep-better",
		label: "Sleep better",
		focus: "sleep",
		icon: "Moon",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
	},
	{
		id: "eat-healthy",
		label: "Eat healthy",
		focus: "food",
		icon: "Food",
		iconTone: "statusSuccess",
		tileTone: "statusSuccessSubtle",
	},
	{
		id: "stay-organized",
		label: "Stay organized",
		focus: "planning",
		icon: "Filled/Calendar",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	},
	{
		id: "less-stress",
		label: "Less stress",
		focus: "calm",
		icon: "Heart",
		iconTone: "statusSuccess",
		tileTone: "statusSuccessSubtle",
	},
];

export const MAX_GOALS = 3;

export type Gender = "male" | "female" | "other";
export type WorkStyle = "office" | "remote" | "hybrid";
export type HeightUnit = "cm" | "ft";
export type WeightUnit = "kg" | "lb";
export type StartPath = "talk" | "steps";

export type ModuleId =
	| "daily-life"
	| "career"
	| "workout"
	| "finance"
	| "skincare"
	| "food"
	| "fashion"
	| "faith";

export type ModuleOption = {
	id: ModuleId;
	label: string;
	summary: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
	/** Goal that recommends this module; daily life is always recommended. */
	goal?: GoalId;
};

export const moduleOptions: readonly ModuleOption[] = [
	{
		id: "daily-life",
		label: "Daily life",
		summary: "Plan · habits · sleep",
		icon: "Sun",
		iconTone: "statusSuccess",
		tileTone: "statusSuccessSubtle",
	},
	{
		id: "career",
		label: "Career",
		summary: "Applications · prep · skills",
		icon: "Briefcase",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	},
	{
		id: "workout",
		label: "Workout",
		summary: "Plans · steps · energy",
		icon: "Dumbbell",
		iconTone: "statusDanger",
		tileTone: "bgSubtle",
		goal: "lose-weight",
	},
	{
		id: "finance",
		label: "Finance",
		summary: "Budget · bills · savings",
		icon: "Wallet",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
		goal: "save-money",
	},
	{
		id: "skincare",
		label: "Skincare",
		summary: "AM/PM · products",
		icon: "Drop",
		iconTone: "statusViolet",
		tileTone: "statusVioletSubtle",
		goal: "clear-skin",
	},
	{
		id: "food",
		label: "Food",
		summary: "Meals · diet · planning",
		icon: "Food",
		iconTone: "statusCaution",
		tileTone: "statusCautionSubtle",
		goal: "eat-healthy",
	},
	{
		id: "fashion",
		label: "Fashion",
		summary: "Wardrobe · outfits",
		icon: "Shirt",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	},
	{
		id: "faith",
		label: "Faith",
		summary: "Prayers · Quran · Qibla",
		icon: "Moon",
		iconTone: "statusSuccess",
		tileTone: "statusSuccessSubtle",
	},
];

/** Goal → module that serves it. Muscle building and weight loss both map to Workout. */
export const goalModule: Partial<Record<GoalId, ModuleId>> = {
	"lose-weight": "workout",
	"build-muscle": "workout",
	"save-money": "finance",
	"clear-skin": "skincare",
	"eat-healthy": "food",
};

export type ConnectionId = "calendar" | "smartwatch" | "bank-sms" | "microphone";

export type ReminderId = "morning-plan" | "evening-check-in" | "workout-nudge" | "bill-reminders";
