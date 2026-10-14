import { useEffect } from "react";
import type { HomeHero, HomeModule } from "@/modules/home/lib/module-home";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { useNow } from "./hooks/use-now";
import { SkincareHomeView } from "./components/skincare-home-view";
import { routineStreak } from "./lib/routine";
import { skincareStatus } from "./lib/status";
import { useSkincareStore } from "./store/skincare-store";

function useHydratedSkincare() {
	const doc = useSkincareStore((state) => state.data);
	const hydrate = useSkincareStore((state) => state.hydrate);
	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load skincare", error));
	}, [hydrate]);
	return doc;
}

/** "Skincare · routine streak / 12 days". */
function useSkincareHero(): HomeHero {
	const doc = useHydratedSkincare();
	const now = useNow();
	const streak = routineStreak(doc, now);
	return {
		label: "Skincare · routine streak",
		value: String(streak),
		faint: streak === 1 ? " day" : " days",
	};
}

/** One line for the module picker: "2 of 4 done", "PM routine at 22:30", "12 day streak". */
export function useSkincareStatus(): string {
	const doc = useHydratedSkincare();
	const bedMinutes = useOnboardingStore((state) => state.bedMinutes);
	const now = useNow();
	return skincareStatus(doc, now, bedMinutes);
}

export const skincareHome: HomeModule = {
	glow: "statusViolet",
	action: { icon: "Filled/Camera", label: "Take today's skin photo" },
	useHero: useSkincareHero,
	View: SkincareHomeView,
};
