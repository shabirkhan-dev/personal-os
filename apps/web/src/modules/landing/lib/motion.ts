import type { Transition, Variants } from "motion/react";

/** Shared Motion tokens for the Personal OS landing page. */
export const ATLAS_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const springSnappy: Transition = {
	type: "spring",
	stiffness: 420,
	damping: 28,
	mass: 0.8,
};

export const springSoft: Transition = {
	type: "spring",
	stiffness: 280,
	damping: 26,
	mass: 0.9,
};

export const fadeUpTransition: Transition = {
	duration: 0.65,
	ease: ATLAS_EASE,
};

export const menuPanelVariants: Variants = {
	hidden: {
		opacity: 0,
		y: 10,
		scale: 0.96,
		filter: "blur(6px)",
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		filter: "blur(0px)",
		transition: {
			...springSnappy,
			staggerChildren: 0.045,
			delayChildren: 0.04,
		},
	},
	exit: {
		opacity: 0,
		y: 8,
		scale: 0.97,
		filter: "blur(4px)",
		transition: { duration: 0.15, ease: "easeIn" },
	},
};

export const menuItemVariants: Variants = {
	hidden: { opacity: 0, x: -8, filter: "blur(4px)" },
	visible: {
		opacity: 1,
		x: 0,
		filter: "blur(0px)",
		transition: springSoft,
	},
	exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
};

export const hoverLift = {
	y: -4,
	transition: springSnappy,
} as const;

export const hoverTap = {
	scale: 0.98,
	transition: { duration: 0.12 },
} as const;
