"use client";

import { Cancel01Icon, CheckIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useHoverCapable } from "@starter/ui/hooks/use-hover-capable";
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import {
	AnimatePresence,
	type HTMLMotionProps,
	motion,
	useReducedMotion,
	type Variants,
} from "motion/react";
import {
	forwardRef,
	type PointerEvent,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "outline"
	| "destructive"
	| "default";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface MotionButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	pressScale?: number;
	/** Spawn a Material-style ripple from the press point. Off by default. */
	ripple?: boolean;
	elevated?: boolean;
	loading?: boolean;
	children?: ReactNode;
}

type Ripple = { id: number; x: number; y: number; size: number };

const VARIANT_CLASS: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_0_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]",
	default:
		"bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_0_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.2)] active:shadow-[0_1px_2px_0_rgba(0,0,0,0.12)]",
	secondary: "border border-border bg-card text-foreground hover:bg-secondary/80 shadow-xs",
	ghost: "text-muted-foreground hover:text-foreground hover:bg-primary/5",
	outline: "border border-border bg-transparent text-foreground hover:bg-accent/50 shadow-xs",
	destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
	sm: "h-8 px-3.5 text-xs gap-1.5 rounded-full",
	md: "h-10 px-5 text-sm gap-2 rounded-full",
	lg: "h-12 px-6 text-base gap-2 rounded-full",
	icon: "h-9 w-9 rounded-full justify-center p-0",
};

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(function MotionButton(
	{
		variant = "primary",
		size = "md",
		pressScale = 0.93,
		ripple = false,
		elevated: _elevated = true,
		loading = false,
		className,
		children,
		onPointerDown,
		disabled,
		...rest
	},
	ref,
) {
	const reduce = useReducedMotion();
	const canHover = useHoverCapable();
	const [ripples, setRipples] = useState<Ripple[]>([]);
	const nextId = useRef(0);

	const isDisabled = disabled || loading;

	const handlePointerDown = useCallback(
		(event: PointerEvent<HTMLButtonElement>) => {
			if (ripple && !reduce && !isDisabled) {
				const rect = event.currentTarget.getBoundingClientRect();
				const rippleSize = Math.max(rect.width, rect.height) * 2;
				const id = nextId.current++;
				setRipples((prev) => [
					...prev,
					{
						id,
						x: event.clientX - rect.left,
						y: event.clientY - rect.top,
						size: rippleSize,
					},
				]);
			}
			onPointerDown?.(event);
		},
		[ripple, reduce, isDisabled, onPointerDown],
	);

	return (
		<motion.button
			ref={ref}
			type="button"
			whileTap={reduce || isDisabled ? undefined : { scale: pressScale }}
			whileHover={reduce || !canHover || isDisabled ? undefined : { scale: 1.02 }}
			transition={SPRING_PRESS}
			onPointerDown={handlePointerDown}
			disabled={isDisabled}
			className={cn(
				"inline-flex items-center justify-center font-medium select-none cursor-pointer",
				"transition-colors",
				"disabled:pointer-events-none disabled:opacity-50",
				ripple && "relative overflow-hidden",
				VARIANT_CLASS[variant],
				SIZE_CLASS[size],
				className,
			)}
			{...rest}
		>
			{ripple && !reduce ? (
				<span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
					<AnimatePresence>
						{ripples.map((r) => (
							<motion.span
								key={r.id}
								className="absolute rounded-full bg-current"
								style={{
									left: r.x,
									top: r.y,
									width: r.size,
									height: r.size,
									x: "-50%",
									y: "-50%",
								}}
								initial={{ scale: 0.05, opacity: 0.3 }}
								animate={{ scale: 1, opacity: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 1.6, ease: EASE_OUT }}
								onAnimationComplete={() => setRipples((prev) => prev.filter((x) => x.id !== r.id))}
							/>
						))}
					</AnimatePresence>
				</span>
			) : null}

			{loading ? (
				<span className="inline-flex items-center gap-2">
					<HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin shrink-0" />
					<span>{children}</span>
				</span>
			) : (
				children
			)}
		</motion.button>
	);
});

MotionButton.displayName = "MotionButton";

/* =========================================================================
   STATEFUL BUTTON (Cascading Text Stagger & Icon Slot Animations)
   ========================================================================= */

export type ButtonState = "idle" | "loading" | "success" | "error";

export interface StatefulButtonProps extends Omit<MotionButtonProps, "children"> {
	state?: ButtonState;
	children: ReactNode;
	loadingText?: ReactNode;
	successText?: ReactNode;
	errorText?: ReactNode;
	icon?: ReactNode;
}

const CASCADE_STAGGER = 0.025;
const ROLL_BLUR = "blur(6px)";

const CASCADE_LETTER_VARIANTS: Variants = {
	initial: { opacity: 0, y: "105%", filter: ROLL_BLUR },
	animate: (delay: number = 0) => ({
		opacity: 1,
		y: "0%",
		filter: "blur(0px)",
		transition: { ...SPRING_SWAP, delay },
	}),
	exit: (delay: number = 0) => ({
		opacity: 0,
		y: "-105%",
		filter: ROLL_BLUR,
		transition: { duration: 0.16, ease: EASE_OUT, delay: delay * 0.5 },
	}),
};

const ICON_VARIANTS: Variants = {
	initial: { opacity: 0, width: 0, scale: 0.7, filter: ROLL_BLUR },
	animate: {
		opacity: 1,
		width: "1.25rem",
		scale: 1,
		filter: "blur(0px)",
		transition: SPRING_SWAP,
	},
	exit: {
		opacity: 0,
		width: 0,
		scale: 0.7,
		filter: ROLL_BLUR,
		transition: { duration: 0.16, ease: EASE_OUT },
	},
};

function IconSlot({ keyId, children }: { keyId: string; children: ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<motion.span
			key={keyId}
			variants={ICON_VARIANTS}
			initial={reduce ? { opacity: 0 } : "initial"}
			animate={reduce ? { opacity: 1 } : "animate"}
			exit={reduce ? { opacity: 0 } : "exit"}
			transition={reduce ? { duration: 0.15 } : undefined}
			className="inline-grid shrink-0 place-items-center overflow-hidden mr-1.5"
		>
			{children}
		</motion.span>
	);
}

function TextSlot({ value, children }: { value: string; children: ReactNode }) {
	const reduce = useReducedMotion();
	const measureRef = useRef<HTMLSpanElement>(null);
	const [width, setWidth] = useState<number>();
	const label = typeof children === "string" ? children : null;
	const cascade = label !== null && !reduce;

	useLayoutEffect(() => {
		if (children === undefined || children === null) return;
		const nextWidth = measureRef.current?.offsetWidth;
		if (!nextWidth) return;
		setWidth((current) => (current === nextWidth ? current : nextWidth));
	}, [children]);

	return (
		<motion.span
			initial={false}
			animate={{ width }}
			transition={reduce ? { duration: 0 } : SPRING_SWAP}
			className="relative inline-block overflow-hidden whitespace-nowrap align-bottom"
		>
			<span ref={measureRef} aria-hidden className="invisible inline-block whitespace-nowrap">
				{cascade
					? label.split("").map((char, index) => (
							<span
								// oxlint-disable-next-line react/no-array-index-key -- position is slot identity
								key={index}
								className="inline-block whitespace-pre"
							>
								{char}
							</span>
						))
					: children}
			</span>

			{cascade ? (
				<>
					<span className="sr-only">{label}</span>
					<AnimatePresence initial={false}>
						<motion.span
							key={`cascade-${value}`}
							aria-hidden
							initial="initial"
							animate="animate"
							exit="exit"
							className="absolute left-0 top-0 inline-block whitespace-pre"
						>
							{label.split("").map((char, index) => (
								<motion.span
									// oxlint-disable-next-line react/no-array-index-key -- position is slot identity
									key={index}
									custom={index * CASCADE_STAGGER}
									variants={CASCADE_LETTER_VARIANTS}
									className="inline-block whitespace-pre will-change-[opacity,filter,transform]"
								>
									{char}
								</motion.span>
							))}
						</motion.span>
					</AnimatePresence>
				</>
			) : (
				<AnimatePresence initial={false}>
					<motion.span
						key={`text-${value}`}
						initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: ROLL_BLUR }}
						animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: ROLL_BLUR }}
						transition={reduce ? { duration: 0.15 } : SPRING_SWAP}
						className="absolute left-0 top-0 inline-block will-change-[opacity,filter,transform]"
					>
						{children}
					</motion.span>
				</AnimatePresence>
			)}
		</motion.span>
	);
}

export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(
	function StatefulButton(
		{
			state = "idle",
			children,
			loadingText = "Loading",
			successText = "Done",
			errorText = "Try again",
			icon,
			disabled,
			...rest
		},
		ref,
	) {
		const isBusy = state === "loading";
		const stateText =
			state === "loading"
				? loadingText
				: state === "success"
					? successText
					: state === "error"
						? errorText
						: children;
		const textKey = typeof stateText === "string" ? `${state}-${stateText}` : state;

		return (
			<MotionButton
				ref={ref}
				disabled={disabled || isBusy}
				aria-busy={isBusy}
				whileHover={undefined}
				{...rest}
			>
				<span className="relative inline-flex items-center justify-center overflow-hidden">
					<AnimatePresence initial={false}>
						{state === "loading" ? (
							<IconSlot keyId="loading-icon">
								<HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin text-current" />
							</IconSlot>
						) : null}
						{state === "success" ? (
							<IconSlot keyId="success-icon">
								<HugeiconsIcon
									icon={CheckIcon}
									className="size-4 text-emerald-500 dark:text-emerald-400"
								/>
							</IconSlot>
						) : null}
						{state === "error" ? (
							<IconSlot keyId="error-icon">
								<HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />
							</IconSlot>
						) : null}
					</AnimatePresence>

					<TextSlot value={textKey}>{stateText}</TextSlot>

					<AnimatePresence initial={false}>
						{state === "idle" && icon ? <IconSlot keyId="idle-icon">{icon}</IconSlot> : null}
					</AnimatePresence>
				</span>
			</MotionButton>
		);
	},
);

StatefulButton.displayName = "StatefulButton";
