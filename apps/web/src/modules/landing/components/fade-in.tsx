"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ATLAS_EASE } from "../lib/motion";

type FadeInProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	y?: number;
	blur?: number;
	duration?: number;
	once?: boolean;
};

export function FadeIn({
	children,
	className,
	delay = 0,
	y = 24,
	blur = 8,
	duration = 0.7,
	once = true,
}: FadeInProps) {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
			whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			viewport={{ once, margin: "-80px" }}
			transition={{ duration, delay, ease: ATLAS_EASE }}
		>
			{children}
		</motion.div>
	);
}
