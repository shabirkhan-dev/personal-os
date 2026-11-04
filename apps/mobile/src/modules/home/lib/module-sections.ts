import type { Href } from "expo-router";

export type Section = { label: string; href: Href & string };

/**
 * The screens inside each module, opened from the header's module pill. Keyed by the pill's
 * label; Insights is left out because it has its own tab.
 */
export const MODULE_SECTIONS: Record<string, readonly Section[]> = {
	Overview: [
		{ label: "Morning brief", href: "/daily/brief" },
		{ label: "Plan the day", href: "/daily/plan" },
		{ label: "Minimum day", href: "/daily/minimum" },
		{ label: "Sleep", href: "/daily/sleep" },
		{ label: "Close the day", href: "/daily/close" },
		{ label: "Calendar", href: "/calendar" },
	],
	"Daily life": [
		{ label: "Morning brief", href: "/daily/brief" },
		{ label: "Plan the day", href: "/daily/plan" },
		{ label: "Minimum day", href: "/daily/minimum" },
		{ label: "Sleep", href: "/daily/sleep" },
		{ label: "Close the day", href: "/daily/close" },
	],
	Career: [
		{ label: "Applications", href: "/career/applications" },
		{ label: "Interview prep", href: "/career/prep" },
		{ label: "Skill", href: "/career/skill" },
		{ label: "Skill path", href: "/career/skill-path" },
	],
	Training: [
		{ label: "This week", href: "/training/week" },
		{ label: "Programs", href: "/training/programs" },
		{ label: "Exercises", href: "/training/exercises" },
		{ label: "Skills", href: "/training/skills" },
		{ label: "Boxing", href: "/training/boxing" },
		{ label: "Calendar", href: "/calendar" },
	],
	Finance: [
		{ label: "Add spending", href: "/finance/log" },
		{ label: "Runway", href: "/finance/runway" },
		{ label: "Budget", href: "/finance/budget" },
		{ label: "Income", href: "/finance/income" },
		{ label: "History", href: "/finance/history" },
	],
	Care: [
		{ label: "Routine", href: "/care/routine" },
		{ label: "Shelf", href: "/care/shelf" },
		{ label: "Hair", href: "/care/hair" },
		{ label: "Body", href: "/care/body" },
		{ label: "Weekly check-in", href: "/care/check-in" },
	],
	Food: [
		{ label: "Log a meal", href: "/food/log" },
		{ label: "Meal plan", href: "/food/plan" },
		{ label: "Groceries", href: "/food/grocery" },
		{ label: "Recipes", href: "/food/recipes" },
		{ label: "Scan a barcode", href: "/food/scan" },
		{ label: "Goal", href: "/food/goal" },
	],
	Faith: [
		{ label: "Qibla", href: "/faith/qibla" },
		{ label: "Tasbih", href: "/faith/tasbih" },
		{ label: "Recitation", href: "/faith/recitation" },
		{ label: "Grow", href: "/faith/grow" },
		{ label: "Flashcards", href: "/faith/flashcards" },
		{ label: "Zakat", href: "/faith/zakat" },
	],
	Fashion: [
		{ label: "Wardrobe", href: "/fashion/wardrobe" },
		{ label: "Week plan", href: "/fashion/plan" },
		{ label: "To buy", href: "/fashion/wishlist" },
		{ label: "Watches and scents", href: "/fashion/watches" },
	],
	Health: [
		{ label: "Vitals", href: "/health/vitals" },
		{ label: "Medicines and supplements", href: "/health/medicines" },
		{ label: "Checkups", href: "/health/checkups" },
		{ label: "Lab results", href: "/health/labs" },
		{ label: "Records", href: "/health/records" },
		{ label: "Symptoms", href: "/health/symptoms" },
		{ label: "Health profile", href: "/health/profile" },
	],
	Wishlist: [
		{ label: "Add a dream", href: "/wishlist/add" },
		{ label: "Roadmap", href: "/wishlist/roadmap" },
		{ label: "Compare", href: "/wishlist/compare" },
		{ label: "Garage", href: "/wishlist/garage" },
	],
};

export function sectionsFor(label: string): readonly Section[] {
	// Daily life's inner screens carry the "Today" pill.
	return MODULE_SECTIONS[label === "Today" ? "Daily life" : label] ?? [];
}
