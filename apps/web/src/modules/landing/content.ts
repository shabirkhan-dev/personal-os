import type { IconName } from "@/components/icon";

/** A token pair: glyph colour and the soft tile behind it (CSS variable names). */
type Tone = { icon: string; tile: string };

const tones = {
	link: { icon: "var(--text-link)", tile: "var(--accent-subtle)" },
	violet: { icon: "var(--status-violet)", tile: "var(--status-violet-subtle)" },
	success: { icon: "var(--status-success)", tile: "var(--status-success-subtle)" },
	caution: { icon: "var(--status-caution)", tile: "var(--status-caution-subtle)" },
	danger: { icon: "var(--status-danger)", tile: "var(--status-danger-subtle)" },
} satisfies Record<string, Tone>;

export type Feature = { icon: IconName; tone: Tone; title: string; body: string };

export const features: readonly Feature[] = [
	{
		icon: "Filled/Calendar",
		tone: tones.link,
		title: "Today, at a glance",
		body: "Your plan, bills, workouts and routines on one timeline — with what’s next always on top.",
	},
	{
		icon: "Filled/Sparkle",
		tone: tones.violet,
		title: "Just ask, or log",
		body: "Type or say “spent 1,200 on lunch” or “what’s left this month?”. One bar does both.",
	},
	{
		icon: "Filled/Eye",
		tone: tones.success,
		title: "Private by default",
		body: "Works without an account. Your plan lives on your phone until you choose to sync it.",
	},
];

export type Module = { icon: IconName; tone: Tone; name: string; meta: string; body: string };

export const modules: readonly Module[] = [
	{
		icon: "Sun",
		tone: tones.success,
		name: "Daily life",
		meta: "Plan · habits · sleep",
		body: "Wake-up to wind-down, built around your real day.",
	},
	{
		icon: "Wallet",
		tone: tones.caution,
		name: "Finance",
		meta: "Budget · bills · savings",
		body: "Know what’s left to spend, and never miss a bill.",
	},
	{
		icon: "Dumbbell",
		tone: tones.danger,
		name: "Workout",
		meta: "Plans · steps · energy",
		body: "A weekly plan that fits your schedule and goals.",
	},
	{
		icon: "Drop",
		tone: tones.violet,
		name: "Skincare",
		meta: "AM/PM · products",
		body: "Routines and restock reminders, morning and night.",
	},
	{
		icon: "Food",
		tone: tones.caution,
		name: "Food",
		meta: "Meals · diet · planning",
		body: "Meals, recipes and calories without the spreadsheet.",
	},
	{
		icon: "Shirt",
		tone: tones.link,
		name: "Fashion",
		meta: "Wardrobe · outfits",
		body: "Your wardrobe, and an outfit ready for tomorrow.",
	},
];

export type Step = { title: string; body: string };

export const steps: readonly Step[] = [
	{
		title: "Tell it about you",
		body: "A few quick questions — your day, your goals, what you want help with. Type or talk.",
	},
	{
		title: "Get your first day",
		body: "Personal OS builds a plan around your schedule. Change anything you like.",
	},
	{
		title: "Live from Today",
		body: "One screen for what’s next. Ask, log and tick things off as you go.",
	},
];
