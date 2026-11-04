import { router } from "expo-router";
import { create } from "zustand";

/** Whether the Areas picker (the module switcher on Home) is open. Not saved between launches. */
export const useAreasPicker = create<{ open: boolean }>(() => ({ open: false }));

export function setAreasOpen(open: boolean): void {
	useAreasPicker.setState({ open });
}

/** Areas from any screen: back to Home with the module picker open, the same as on Home. */
export function openAreas(): void {
	setAreasOpen(true);
	router.dismissTo("/");
}
