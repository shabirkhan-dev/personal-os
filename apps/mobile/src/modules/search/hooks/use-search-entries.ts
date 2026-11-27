import { AREA_LABELS } from "@personal-os/domain/care";
import { STAGE_LABELS } from "@personal-os/domain/career";
import { CATEGORY_LABELS as PIECE_LABELS } from "@personal-os/domain/fashion";
import { CATEGORY_LABELS as MONEY_LABELS } from "@personal-os/domain/finance";
import { RECORD_LABELS } from "@personal-os/domain/health";
import { useCollection } from "@/lib/db/collection";
import { calendarEvents } from "@/modules/calendar/data/collections";
import { careProducts, careSteps } from "@/modules/care/data/collections";
import { applications } from "@/modules/career/data/collections";
import { resources } from "@/modules/faith/data/collections";
import { pieces } from "@/modules/fashion/data/collections";
import { financeBills, financeEntries } from "@/modules/finance/data/collections";
import { groceries, myRecipes } from "@/modules/food/data/collections";
import { healthCheckups, healthMedicines, healthRecords } from "@/modules/health/data/collections";
import { wishlistDreams } from "@/modules/wishlist/data/collections";
import { trainingPrograms } from "@/modules/workout/data/collections";
import type { SearchEntry } from "../lib/search-index";

const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;
const shortDate = (iso: string) =>
	new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const join = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");

/** Screens worth finding by name, so "budget" or "backup" goes straight there. */
const SCREENS: SearchEntry[] = [
	["Budget", "Money", "/finance/budget"],
	["Spending history", "Money", "/finance/history"],
	["Recipes", "Food", "/food/recipes"],
	["Meal plan", "Food", "/food/plan"],
	["Grocery list", "Food", "/food/grocery"],
	["Tasbih", "Faith", "/faith/tasbih"],
	["Zakat", "Faith", "/faith/zakat"],
	["Qibla", "Faith", "/faith/qibla"],
	["Medicines", "Health", "/health/medicines"],
	["Vitals", "Health", "/health/vitals"],
	["Care routine", "Care", "/care/routine"],
	["Product shelf", "Care", "/care/shelf"],
	["Programs", "Training", "/training/programs"],
	["Minimum day", "Daily life", "/daily/minimum"],
	["Sleep", "Daily life", "/daily/sleep"],
	["Weekly review", "Your week", "/review"],
	["Templates", "App", "/templates"],
	["Reminders", "Settings", "/reminders"],
	["Backup and restore", "Settings", "/backup"],
	["App lock and privacy", "Settings", "/security"],
	["Your AI key", "Settings", "/ai-key"],
	["Calendar", "App", "/calendar"],
].map(([title, module, href]) => ({
	id: `screen-${href}`,
	module: module ?? "",
	title: title ?? "",
	subtitle: "Open the screen",
	href: href ?? "/",
}));

/** Everything the person saved, as search entries. Only reads while the search screen is open. */
export function useSearchEntries(): SearchEntry[] {
	const data = {
		recipes: useCollection(myRecipes).data ?? [],
		groceries: useCollection(groceries).data ?? [],
		entries: useCollection(financeEntries).data ?? [],
		bills: useCollection(financeBills).data ?? [],
		medicines: useCollection(healthMedicines).data ?? [],
		checkups: useCollection(healthCheckups).data ?? [],
		records: useCollection(healthRecords).data ?? [],
		steps: useCollection(careSteps).data ?? [],
		products: useCollection(careProducts).data ?? [],
		programs: useCollection(trainingPrograms).data ?? [],
		resources: useCollection(resources).data ?? [],
		applications: useCollection(applications).data ?? [],
		pieces: useCollection(pieces).data ?? [],
		dreams: useCollection(wishlistDreams).data ?? [],
		events: useCollection(calendarEvents).data ?? [],
	};
	return [
		...data.recipes.map((item) => ({
			id: `recipe-${item.id}`,
			module: "Recipe",
			title: item.name,
			subtitle: join(`${item.minutes} min`, item.note),
			href: `/food/recipe/${item.id}`,
		})),
		...data.groceries
			.flatMap((list) => list.items)
			.map((item) => ({
				id: `grocery-${item.id}`,
				module: "Grocery",
				title: item.name,
				subtitle: join(item.amount, item.price > 0 && rupees(item.price)),
				href: "/food/grocery",
			})),
		...data.entries.map((item) => ({
			id: `money-${item.id}`,
			module: item.kind === "income" ? "Income" : "Spending",
			title: item.title || MONEY_LABELS[item.category],
			subtitle: join(
				rupees(item.amount),
				MONEY_LABELS[item.category],
				shortDate(item.at),
				item.note,
			),
			href: "/finance/history",
		})),
		...data.bills.map((item) => ({
			id: `bill-${item.id}`,
			module: "Bill",
			title: item.name,
			subtitle: join(item.provider, rupees(item.amount)),
			href: "/finance/budget",
		})),
		...data.medicines.map((item) => ({
			id: `medicine-${item.id}`,
			module: item.type === "supplement" ? "Supplement" : "Medicine",
			title: item.name,
			subtitle: join(item.dose, item.purpose),
			href: "/health/medicines",
		})),
		...data.checkups.map((item) => ({
			id: `checkup-${item.id}`,
			module: "Check-up",
			title: item.title,
			subtitle: join(item.on, item.note),
			href: "/health/checkups",
		})),
		...data.records.map((item) => ({
			id: `record-${item.id}`,
			module: "Health record",
			title: item.title,
			subtitle: join(RECORD_LABELS[item.kind], item.on, item.note),
			href: "/health/records",
		})),
		...data.steps.map((item) => ({
			id: `step-${item.id}`,
			module: "Care step",
			title: item.name,
			subtitle: join(AREA_LABELS[item.area], item.routine, item.detail),
			href: `/care/step?routine=${item.routine}&id=${item.id}`,
		})),
		...data.products.map((item) => ({
			id: `product-${item.id}`,
			module: "Care product",
			title: item.name,
			subtitle: join(AREA_LABELS[item.area], item.howTo),
			href: "/care/shelf",
		})),
		...data.programs.map((item) => ({
			id: `program-${item.id}`,
			module: "Program",
			title: item.title,
			subtitle: join(item.goal, item.summary),
			href: `/training/program/${item.id}`,
		})),
		...data.resources.map((item) => ({
			id: `resource-${item.id}`,
			module: "Faith",
			title: item.title,
			subtitle: item.body.slice(0, 120),
			href: "/faith/grow",
		})),
		...data.applications.map((item) => ({
			id: `application-${item.id}`,
			module: "Job",
			title: join(item.role, item.company),
			subtitle: join(STAGE_LABELS[item.stage], item.where, item.pay),
			href: `/career/application/${item.id}`,
		})),
		...data.pieces.map((item) => ({
			id: `piece-${item.id}`,
			module: "Wardrobe",
			title: item.name,
			subtitle: join(PIECE_LABELS[item.category], item.size, item.fabric),
			href: `/fashion/piece/${item.id}`,
		})),
		...data.dreams.map((item) => ({
			id: `dream-${item.id}`,
			module: "Dream",
			title: item.name,
			subtitle: join(rupees(item.price), `${rupees(item.savedAmount)} saved`),
			href: `/wishlist/dream/${item.id}`,
		})),
		...data.events.map((item) => ({
			id: `event-${item.id}`,
			module: "Calendar",
			title: item.title,
			subtitle: item.date,
			href: "/calendar",
		})),
		...SCREENS,
	];
}
