"use client";
// beui.dev/components/motion/tabs

import { EASE_OUT } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { MotionConfig, motion, type Transition, useReducedMotion } from "motion/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useId,
	useMemo,
	useState,
} from "react";

type Variant = "pill" | "underline" | "segment";
type Size = "sm" | "md" | "lg";

type Ctx = {
	value: string;
	setValue: (v: string) => void;
	layoutId: string;
	variant: Variant;
	size: Size;
};

const TabsCtx = createContext<Ctx | null>(null);

function useTabs() {
	const ctx = useContext(TabsCtx);
	if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
	return ctx;
}

// Weighty spring for the active-tab indicator: a touch of overshoot so it
// settles with life instead of snapping.
const transition: Transition = {
	type: "spring",
	stiffness: 170,
	damping: 24,
	mass: 1.2,
};

export function Tabs({
	defaultValue,
	value,
	onValueChange,
	variant = "pill",
	size = "md",
	children,
	className,
}: {
	defaultValue?: string;
	value?: string;
	onValueChange?: (v: string) => void;
	variant?: Variant;
	size?: Size;
	children: ReactNode;
	className?: string;
}) {
	const [internal, setInternal] = useState(defaultValue ?? "");
	const layoutId = useId();
	const reduce = useReducedMotion();
	const controlled = value !== undefined;
	const current = controlled ? value : internal;
	const setValue = useCallback(
		(v: string) => {
			if (!controlled) setInternal(v);
			onValueChange?.(v);
		},
		[controlled, onValueChange],
	);
	const contextValue = useMemo(
		() => ({ value: current, setValue, layoutId, variant, size }),
		[current, layoutId, setValue, variant, size],
	);
	return (
		<MotionConfig transition={reduce ? { duration: 0 } : transition}>
			<TabsCtx.Provider value={contextValue}>
				{/* layoutRoot: the indicator's layoutId measures in page coordinates, so
            inside fixed/scrolled containers it would replay scroll offsets as
            movement. The pill only ever travels within the list, so scoping
            projection to the Tabs wrapper is always correct. */}
				<motion.div layoutRoot className={className}>
					{children}
				</motion.div>
			</TabsCtx.Provider>
		</MotionConfig>
	);
}

const listClasses: Record<Variant, string> = {
	pill: "inline-flex items-center gap-1 rounded-full bg-card p-1",
	underline: "inline-flex items-center gap-1 border-b border-border",
	segment: "inline-flex items-center gap-0 rounded-lg bg-card p-0.5",
};

const listSizeClasses: Record<Size, string> = {
	sm: "h-8 text-xs",
	md: "h-9 text-xs sm:text-sm",
	lg: "h-11 text-sm sm:text-base",
};

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
	const { variant, size } = useTabs();
	return (
		<div role="tablist" className={cn(listClasses[variant], listSizeClasses[size], className)}>
			{children}
		</div>
	);
}

const triggerSizeClasses: Record<Size, string> = {
	sm: "px-2.5 py-1 text-xs min-h-[32px]",
	md: "px-3.5 py-1.5 text-xs sm:text-sm min-h-[36px]",
	lg: "px-4.5 py-2 text-sm sm:text-base min-h-[44px]",
};

export function TabsTrigger({
	value,
	children,
	className,
	indicatorClassName,
}: {
	value: string;
	children: ReactNode;
	className?: string;
	indicatorClassName?: string;
}) {
	const { value: current, setValue, layoutId, variant, size } = useTabs();
	const active = current === value;
	const usesDefaultIndicator = indicatorClassName === undefined;

	if (variant === "underline") {
		return (
			<button
				type="button"
				role="tab"
				aria-selected={active}
				onClick={() => setValue(value)}
				className={cn(
					"relative isolate px-3 pb-2.5 pt-1 -mb-px font-medium transition-colors inline-flex items-center",
					triggerSizeClasses[size],
					active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
					className,
				)}
			>
				{children}
				{active ? (
					<motion.span
						layoutId={layoutId}
						className={cn("absolute -bottom-px left-0 right-0 h-px bg-primary", indicatorClassName)}
					/>
				) : null}
			</button>
		);
	}

	// The default max-contrast pill uses exclusion so labels invert exactly as
	// the indicator passes beneath them. Custom indicators retain explicit text
	// colors because their background may not be suitable for blending.
	const radius = variant === "pill" ? "rounded-full" : "rounded-md";

	return (
		<div className="relative">
			{active ? (
				<motion.span
					layoutId={layoutId}
					style={{ borderRadius: variant === "pill" ? 9999 : 8 }}
					className={cn("absolute inset-0 bg-primary", radius, indicatorClassName)}
				/>
			) : null}
			<button
				type="button"
				role="tab"
				aria-selected={active}
				onClick={() => setValue(value)}
				className={cn(
					"relative z-10 inline-flex items-center justify-center whitespace-nowrap bg-transparent font-medium outline-none",
					triggerSizeClasses[size],
					usesDefaultIndicator
						? "text-white mix-blend-exclusion transition-opacity"
						: "transition-colors",
					usesDefaultIndicator
						? active
							? "opacity-100"
							: "opacity-70 hover:opacity-100"
						: active
							? "text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					radius,
					className,
				)}
			>
				{children}
			</button>
		</div>
	);
}

export function TabsContent({
	value,
	children,
	className,
}: {
	value: string;
	children: ReactNode;
	className?: string;
}) {
	const { value: current } = useTabs();
	const reduce = useReducedMotion();
	const active = current === value;
	// Inactive panels stay mounted but hidden, so their content (e.g. source
	// code) is present in the server-rendered HTML for crawlers and assistive
	// tech, instead of being dropped from the DOM.
	if (!active) {
		return (
			<div hidden className={className}>
				{children}
			</div>
		);
	}
	return (
		<motion.div
			key={value}
			initial={{ opacity: 0, y: reduce ? 0 : 4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.18, ease: EASE_OUT }}
			className={cn("mt-4", className)}
		>
			{children}
		</motion.div>
	);
}
