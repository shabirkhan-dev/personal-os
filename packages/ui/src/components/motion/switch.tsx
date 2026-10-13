"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { Cancel01Icon, CheckIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef, useState } from "react";

export type SwitchVariant = "default" | "success" | "destructive" | "indigo";
export type SwitchSize = "sm" | "default" | "lg";

export interface MotionSwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
	variant?: SwitchVariant;
	size?: SwitchSize;
	checkedIcon?: ReactNode;
	uncheckedIcon?: ReactNode;
	loading?: boolean;
	className?: string;
}

const VARIANT_TRACK: Record<SwitchVariant, string> = {
	default:
		"data-checked:bg-primary dark:data-checked:bg-teal-500 data-unchecked:bg-input dark:data-unchecked:bg-zinc-800",
	success:
		"data-checked:bg-emerald-600 dark:data-checked:bg-emerald-500 data-unchecked:bg-input dark:data-unchecked:bg-zinc-800",
	destructive:
		"data-checked:bg-destructive dark:data-checked:bg-red-600 data-unchecked:bg-input dark:data-unchecked:bg-zinc-800",
	indigo:
		"data-checked:bg-indigo-600 dark:data-checked:bg-purple-600 data-unchecked:bg-input dark:data-unchecked:bg-zinc-800",
};

const SIZE_TRACK: Record<SwitchSize, string> = {
	sm: "h-5 w-9 p-0.5",
	default: "h-6 w-11 p-0.5",
	lg: "h-7 w-14 p-1",
};

const SIZE_THUMB: Record<SwitchSize, string> = {
	sm: "size-4",
	default: "size-5",
	lg: "size-5",
};

const SIZE_TRANSLATE: Record<SwitchSize, string> = {
	sm: "data-checked:translate-x-4 data-unchecked:translate-x-0",
	default: "data-checked:translate-x-5 data-unchecked:translate-x-0",
	lg: "data-checked:translate-x-7 data-unchecked:translate-x-0",
};

export const MotionSwitch = forwardRef<HTMLButtonElement, MotionSwitchProps>(
	(
		{
			variant = "default",
			size = "default",
			checkedIcon,
			uncheckedIcon,
			loading = false,
			disabled,
			checked,
			defaultChecked,
			onCheckedChange,
			className,
			...props
		},
		ref,
	) => {
		const reduce = useReducedMotion();
		const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
		const isChecked = checked !== undefined ? checked : internalChecked;

		const handleCheckedChange = (
			newChecked: boolean,
			eventDetails: SwitchPrimitive.Root.ChangeEventDetails,
		) => {
			if (checked === undefined) setInternalChecked(newChecked);
			onCheckedChange?.(newChecked, eventDetails);
		};

		return (
			<SwitchPrimitive.Root
				ref={ref}
				data-slot="motion-switch"
				disabled={disabled || loading}
				checked={isChecked}
				onCheckedChange={handleCheckedChange}
				className={cn(
					"peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 select-none shadow-inner",
					SIZE_TRACK[size],
					VARIANT_TRACK[variant],
					className,
				)}
				{...props}
			>
				<SwitchPrimitive.Thumb
					data-slot="motion-switch-thumb"
					className={cn(
						"pointer-events-none relative block rounded-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-md ring-0 transition-transform duration-200 ease-out flex items-center justify-center overflow-hidden",
						SIZE_THUMB[size],
						SIZE_TRANSLATE[size],
					)}
				>
					<AnimatePresence mode="wait" initial={false}>
						{loading ? (
							<motion.span
								key="loading"
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
								transition={SPRING_SWAP}
								className="flex items-center justify-center"
							>
								<HugeiconsIcon
									icon={Loading01Icon}
									size={12}
									className="animate-spin text-muted-foreground"
								/>
							</motion.span>
						) : isChecked ? (
							<motion.span
								key="checked"
								initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
								animate={{ opacity: 1, scale: 1, rotate: 0 }}
								exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
								transition={reduce ? { duration: 0 } : SPRING_SWAP}
								className="flex items-center justify-center"
							>
								{checkedIcon ?? (
									<HugeiconsIcon icon={CheckIcon} size={12} className="stroke-[2.5]" />
								)}
							</motion.span>
						) : (
							<motion.span
								key="unchecked"
								initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
								animate={{ opacity: 1, scale: 1, rotate: 0 }}
								exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
								transition={reduce ? { duration: 0 } : SPRING_SWAP}
								className="flex items-center justify-center"
							>
								{uncheckedIcon ?? (
									<HugeiconsIcon
										icon={Cancel01Icon}
										size={10}
										className="stroke-[2.5] opacity-60"
									/>
								)}
							</motion.span>
						)}
					</AnimatePresence>
				</SwitchPrimitive.Thumb>
			</SwitchPrimitive.Root>
		);
	},
);

MotionSwitch.displayName = "MotionSwitch";

export type StatefulSwitchProps = Omit<MotionSwitchProps, "checked" | "onCheckedChange"> & {
	defaultChecked?: boolean;
	onToggle?: (checked: boolean) => Promise<boolean | void> | boolean | void;
};

export function StatefulSwitch({
	defaultChecked = false,
	onToggle,
	disabled,
	...props
}: StatefulSwitchProps) {
	const [checked, setChecked] = useState(defaultChecked);
	const [loading, setLoading] = useState(false);

	const handleChange = async (nextState: boolean) => {
		if (loading || disabled) return;
		if (!onToggle) {
			setChecked(nextState);
			return;
		}

		setLoading(true);
		try {
			const res = await onToggle(nextState);
			if (res !== false) {
				setChecked(nextState);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<MotionSwitch
			checked={checked}
			onCheckedChange={handleChange}
			loading={loading}
			disabled={disabled}
			{...props}
		/>
	);
}
