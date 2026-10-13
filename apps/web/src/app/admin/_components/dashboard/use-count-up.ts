"use client";

import { animate } from "motion";
import { useEffect, useState } from "react";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function prefersReducedMotion(): boolean {
	return (
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

/** Animates a number from 0 to target on mount; snaps instantly under reduced motion. */
export function useCountUp(target: number, duration = 0.9): number {
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (prefersReducedMotion()) return;
		const controls = animate(0, target, {
			duration,
			ease: EASE_OUT,
			onUpdate: (v) => setValue(v),
		});
		return () => controls.stop();
	}, [target, duration]);

	return prefersReducedMotion() ? target : value;
}
