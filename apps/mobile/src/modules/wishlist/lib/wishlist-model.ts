/** Shared with the assistant: lives in `@personal-os/domain/wishlist`. */
export * from "@personal-os/domain/wishlist";

import type { DreamCategory } from "@personal-os/domain/wishlist";
import type { IconName } from "@/components/icons";

export const CATEGORY_ICONS: Record<DreamCategory, IconName> = {
	tech: "Lightning",
	bikes: "Footsteps",
	cars: "Building",
	gear: "Dumbbell",
	trips: "Sun",
	other: "Star",
};
