"use client";

import { useEffect, useState } from "react";

export function useHoverCapable(): boolean {
	const [canHover, setCanHover] = useState(true);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(hover: hover)");
		setCanHover(mediaQuery.matches);

		const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return canHover;
}
