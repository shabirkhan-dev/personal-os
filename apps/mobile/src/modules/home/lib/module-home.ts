import type { ColorTokens } from "@personal-os/tokens";
import type { ComponentType } from "react";
import type { IconName } from "@/components/icons";

/** The number under the Home header ("Finance · saved this month / Rs 18,500.00"). */
export type HomeHero = {
	label: string;
	value: string;
	/** Dimmer tail after the value: ".00", " kcal", " / 1,950 kcal", " days". */
	faint?: string;
	/** Money: the eye button hides it. */
	hideable?: boolean;
	/** Makes the label a button with a chevron (e.g. Career's runway settings). */
	onLabelPress?: () => void;
	/** Overrides the module's glow while it applies (Faith follows the time of day). */
	glow?: keyof ColorTokens;
};

export type HomeModuleViewProps = {
	/** Increments each time the header's right button is pressed. */
	actionRequest: number;
};

/** One module's Home: its header glow and button, hero number and the cards below. */
export type HomeModule = {
	glow: keyof ColorTokens;
	action: { icon: IconName; label: string };
	useHero: () => HomeHero;
	View: ComponentType<HomeModuleViewProps>;
	/** Drawn behind the header, under the glow (Faith's Sky pattern and sun or moon). */
	Backdrop?: ComponentType;
	/** Where the Insights tab goes on this module's Home; the tab stays disabled without it. */
	onInsights?: () => void;
};
