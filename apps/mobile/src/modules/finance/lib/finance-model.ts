import type { ColorTokens } from "@personal-os/tokens";
import type { Category } from "@personal-os/domain/finance";
import type { IconName } from "@/components/icons";

/** Finance's documents and rules live in `@personal-os/domain`, shared with the assistant. */
export * from "@personal-os/domain/finance";

export const CATEGORY_TONES: Record<Category, keyof ColorTokens> = {
	food: "statusCaution",
	bills: "statusSuccess",
	transport: "accentDefault",
	care: "statusViolet",
	giving: "textSuccess",
	shopping: "statusDanger",
	dreams: "textWarning",
	other: "textTertiary",
};

export const CATEGORY_TILES: Record<Category, keyof ColorTokens> = {
	food: "statusCautionSubtle",
	bills: "statusSuccessSubtle",
	transport: "accentSubtle",
	care: "statusVioletSubtle",
	giving: "statusSuccessSubtle",
	shopping: "statusDangerSubtle",
	dreams: "statusWarningSubtle",
	other: "bgSubtle",
};

export const CATEGORY_ICONS: Record<Category, IconName> = {
	food: "Food",
	bills: "Lightning",
	transport: "Lightning",
	care: "Drop",
	giving: "Heart",
	shopping: "Tag",
	dreams: "Star",
	other: "Wallet",
};
