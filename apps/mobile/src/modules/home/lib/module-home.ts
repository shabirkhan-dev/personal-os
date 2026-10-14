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
};
