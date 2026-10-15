import { create } from "zustand";

/** Career UI requests that start outside the Career view (the hero lives in the shared header). */
type CareerUi = {
	runwayOpen: boolean;
	openRunway: () => void;
	closeRunway: () => void;
};

export const useCareerUi = create<CareerUi>((set) => ({
	runwayOpen: false,
	openRunway: () => set({ runwayOpen: true }),
	closeRunway: () => set({ runwayOpen: false }),
}));
