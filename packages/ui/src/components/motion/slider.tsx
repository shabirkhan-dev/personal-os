/* oxlint-disable react/no-array-index-key */
"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { SPRING_PRESS, SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { type ComponentPropsWithoutRef, useState } from "react";

export type MotionSliderVariant = "default" | "indigo" | "emerald" | "destructive";

export interface MotionSliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	variant?: MotionSliderVariant;
	showTooltip?: boolean;
	formatValue?: (val: number) => string;
	showTicks?: boolean;
	step?: number;
	className?: string;
}

const VARIANT_TRACK: Record<MotionSliderVariant, string> = {
	default: "bg-primary dark:bg-teal-500",
	indigo: "bg-indigo-600 dark:bg-purple-500",
	emerald: "bg-emerald-600 dark:bg-emerald-500",
	destructive: "bg-destructive dark:bg-red-500",
};

const VARIANT_BADGE: Record<MotionSliderVariant, string> = {
	default: "bg-primary text-primary-foreground dark:bg-teal-500 dark:text-zinc-950",
	indigo: "bg-indigo-600 text-white dark:bg-purple-500 dark:text-zinc-950",
	emerald: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950",
	destructive: "bg-destructive text-destructive-foreground dark:bg-red-500 dark:text-white",
};

const defaultFormatValue = (v: number) => String(v);

export function MotionSlider({
	variant = "default",
	showTooltip = true,
	formatValue = defaultFormatValue,
	showTicks = false,
	min = 0,
	max = 100,
	step = 1,
	defaultValue,
	value,
	onValueChange,
	className,
	...props
}: MotionSliderProps) {
	const reduce = useReducedMotion();
	const [internalValue, setInternalValue] = useState<number | readonly number[]>(
		defaultValue ?? (Array.isArray(value) ? value : [min]),
	);
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const activeValue = value !== undefined ? value : internalValue;
	const currentValues = Array.isArray(activeValue) ? activeValue : [activeValue];

	const handleValueChange = (
		val: number | readonly number[],
		eventDetails: SliderPrimitive.Root.ChangeEventDetails,
	) => {
		if (value === undefined) setInternalValue(val);
		// @ts-ignore - Base UI polymorphic onValueChange handler signature variance
		onValueChange?.(val, eventDetails);
	};

	const ticksCount = showTicks ? Math.floor((max - min) / step) : 0;

	return (
		<div
			className="relative w-full py-4 select-none"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<SliderPrimitive.Root
				className={cn("relative flex w-full touch-none items-center select-none", className)}
				data-slot="motion-slider"
				value={activeValue}
				defaultValue={defaultValue}
				onValueChange={handleValueChange}
				min={min}
				max={max}
				step={step}
				thumbAlignment="edge"
				{...props}
			>
				<SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
					<SliderPrimitive.Track
						data-slot="slider-track"
						className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary dark:bg-zinc-800 select-none shadow-inner"
					>
						<SliderPrimitive.Indicator
							data-slot="slider-range"
							className={cn(
								"h-full select-none transition-colors duration-200",
								VARIANT_TRACK[variant],
							)}
						/>
					</SliderPrimitive.Track>

					{/* OPTIONAL STEP TICKS */}
					{showTicks && ticksCount > 0 && (
						<div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none flex justify-between px-1">
							{Array.from({ length: Math.min(ticksCount + 1, 21) }).map((_, i) => (
								// oxlint-disable-next-line react/no-array-index-key -- static tick mark placeholders
								<span
									key={`tick-${i}`}
									className="size-1 rounded-full bg-zinc-400/40 dark:bg-zinc-600/40"
								/>
							))}
						</div>
					)}

					{/* THUMBS WITH FLOATING TOOLTIP BADGE */}
					{currentValues.map((val, index) => (
						/* oxlint-disable-next-line react/no-array-index-key */
						<SliderPrimitive.Thumb
							key={`thumb-${index}`}
							data-slot="slider-thumb"
							onPointerDown={() => setIsDragging(true)}
							onPointerUp={() => setIsDragging(false)}
							className="relative block outline-none group/thumb cursor-grab active:cursor-grabbing focus-visible:outline-none"
						>
							<motion.div
								animate={!reduce && (isDragging || isHovered) ? { scale: 1.25 } : { scale: 1 }}
								whileTap={!reduce ? { scale: 1.35, scaleX: 1.1, scaleY: 0.9 } : undefined}
								transition={SPRING_PRESS}
								className={cn(
									"size-5 rounded-full border-2 border-white dark:border-zinc-950 bg-background shadow-lg ring-2 ring-primary/20 transition-all group-focus-visible/thumb:ring-4 group-focus-visible/thumb:ring-primary/40",
								)}
							/>

							{/* FLOATING TOOLTIP */}
							<AnimatePresence>
								{showTooltip && (isDragging || isHovered) && (
									<motion.div
										initial={{ opacity: 0, y: 8, scale: 0.8 }}
										animate={{ opacity: 1, y: -28, scale: 1 }}
										exit={{ opacity: 0, y: 4, scale: 0.8 }}
										transition={reduce ? { duration: 0 } : SPRING_SWAP}
										className={cn(
											"absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-20",
											VARIANT_BADGE[variant],
										)}
									>
										{formatValue(val)}
									</motion.div>
								)}
							</AnimatePresence>
						</SliderPrimitive.Thumb>
					))}
				</SliderPrimitive.Control>
			</SliderPrimitive.Root>
		</div>
	);
}
