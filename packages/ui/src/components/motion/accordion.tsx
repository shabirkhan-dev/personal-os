"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SPRING_PRESS, SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import React, { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react";

export type AccordionVariant = "default" | "contained" | "ghost";

export interface MotionAccordionProps extends ComponentPropsWithoutRef<
	typeof AccordionPrimitive.Root
> {
	variant?: AccordionVariant;
	className?: string;
}

export const MotionAccordion = forwardRef<HTMLDivElement, MotionAccordionProps>(
	({ variant = "default", className, ...props }, ref) => {
		return (
			<AccordionPrimitive.Root
				ref={ref}
				data-slot="motion-accordion"
				className={cn(
					"w-full",
					variant === "contained" && "space-y-3",
					variant === "default" && "divide-y divide-border border-y border-border",
					variant === "ghost" && "space-y-1",
					className,
				)}
				{...props}
			/>
		);
	},
);

MotionAccordion.displayName = "MotionAccordion";

export interface AccordionItemProps extends ComponentPropsWithoutRef<
	typeof AccordionPrimitive.Item
> {
	variant?: AccordionVariant;
	className?: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
	({ variant = "default", className, ...props }, ref) => {
		return (
			<AccordionPrimitive.Item
				ref={ref}
				data-slot="accordion-item"
				className={cn(
					"group/accordion-item transition-colors",
					variant === "contained" &&
						"rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden p-1 shadow-xs data-open:border-primary/40 data-open:bg-card/90",
					variant === "ghost" && "rounded-xl hover:bg-muted/40 p-1",
					className,
				)}
				{...props}
			/>
		);
	},
);

AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends ComponentPropsWithoutRef<
	typeof AccordionPrimitive.Trigger
> {
	icon?: ReactNode;
	className?: string;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
	({ icon, children, className, ...props }, ref) => {
		const reduce = useReducedMotion();

		return (
			<AccordionPrimitive.Header className="flex">
				<AccordionPrimitive.Trigger
					ref={ref}
					data-slot="accordion-trigger"
					className={cn(
						"group/trigger flex flex-1 items-center justify-between py-4 px-3 text-start text-sm font-semibold transition-all outline-none rounded-xl select-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50",
						className,
					)}
					{...props}
				>
					<span className="flex items-center gap-3">{children}</span>
					<motion.span
						className="shrink-0 text-muted-foreground transition-colors group-hover/trigger:text-foreground"
						variants={{
							closed: { rotate: 0 },
							open: { rotate: 180 },
						}}
						transition={reduce ? { duration: 0 } : SPRING_PRESS}
					>
						{icon ?? <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="stroke-[2.5]" />}
					</motion.span>
				</AccordionPrimitive.Trigger>
			</AccordionPrimitive.Header>
		);
	},
);

AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends ComponentPropsWithoutRef<
	typeof AccordionPrimitive.Panel
> {
	className?: string;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
	({ children, className, ...props }, ref) => {
		const reduce = useReducedMotion();

		return (
			<AccordionPrimitive.Panel
				ref={ref}
				data-slot="accordion-content"
				className="overflow-hidden text-sm text-muted-foreground leading-relaxed"
				{...props}
			>
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={
						reduce ? { duration: 0 } : { height: SPRING_SWAP, opacity: { duration: 0.2 } }
					}
					className={cn("px-3 pb-4 pt-1", className)}
				>
					{children}
				</motion.div>
			</AccordionPrimitive.Panel>
		);
	},
);

AccordionContent.displayName = "AccordionContent";
