"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, Loading01Icon, Remove01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SPRING_PRESS, SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ComponentPropsWithoutRef, forwardRef, useState } from "react";

export type CheckboxVariant = "default" | "indigo" | "emerald" | "destructive";
export type CheckboxSize = "sm" | "default" | "lg";

export interface MotionCheckboxProps extends ComponentPropsWithoutRef<
	typeof CheckboxPrimitive.Root
> {
	variant?: CheckboxVariant;
	size?: CheckboxSize;
	indeterminate?: boolean;
	loading?: boolean;
	className?: string;
}

const VARIANT_CHECKED: Record<CheckboxVariant, string> = {
	default:
		"data-checked:bg-primary data-checked:border-primary dark:data-checked:bg-teal-500 dark:data-checked:border-teal-500 text-primary-foreground dark:text-zinc-950",
	indigo:
		"data-checked:bg-indigo-600 data-checked:border-indigo-600 dark:data-checked:bg-purple-500 dark:data-checked:border-purple-500 text-white dark:text-zinc-950",
	emerald:
		"data-checked:bg-emerald-600 data-checked:border-emerald-600 dark:data-checked:bg-emerald-500 dark:data-checked:border-emerald-500 text-white dark:text-zinc-950",
	destructive:
		"data-checked:bg-destructive data-checked:border-destructive dark:data-checked:bg-red-500 dark:data-checked:border-red-500 text-destructive-foreground dark:text-white",
};

const SIZE_BOX: Record<CheckboxSize, string> = {
	sm: "size-4 rounded-[4px]",
	default: "size-5 rounded-md",
	lg: "size-6 rounded-md",
};

const SIZE_ICON: Record<CheckboxSize, number> = {
	sm: 11,
	default: 13,
	lg: 15,
};

export const MotionCheckbox = forwardRef<HTMLButtonElement, MotionCheckboxProps>(
	(
		{
			variant = "default",
			size = "default",
			indeterminate = false,
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
			eventDetails: CheckboxPrimitive.Root.ChangeEventDetails,
		) => {
			if (checked === undefined) setInternalChecked(newChecked);
			onCheckedChange?.(newChecked, eventDetails);
		};

		return (
			<CheckboxPrimitive.Root
				ref={ref}
				data-slot="motion-checkbox"
				disabled={disabled || loading}
				checked={isChecked}
				onCheckedChange={handleCheckedChange}
				className={cn(
					"peer relative inline-flex shrink-0 items-center justify-center border border-input transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 select-none shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800",
					SIZE_BOX[size],
					VARIANT_CHECKED[variant],
					className,
				)}
				{...props}
			>
				<motion.div
					whileHover={!reduce && !disabled ? { scale: 1.08 } : undefined}
					whileTap={!reduce && !disabled ? { scale: 0.88 } : undefined}
					transition={SPRING_PRESS}
					className="flex items-center justify-center size-full"
				>
					<CheckboxPrimitive.Indicator
						data-slot="motion-checkbox-indicator"
						className="grid place-content-center text-current"
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
										size={SIZE_ICON[size]}
										className="animate-spin"
									/>
								</motion.span>
							) : indeterminate ? (
								<motion.span
									key="indeterminate"
									initial={{ opacity: 0, scale: 0.5 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.5 }}
									transition={reduce ? { duration: 0 } : SPRING_SWAP}
									className="flex items-center justify-center"
								>
									<HugeiconsIcon
										icon={Remove01Icon}
										size={SIZE_ICON[size]}
										className="stroke-[3]"
									/>
								</motion.span>
							) : isChecked ? (
								<motion.span
									key="checked"
									initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
									animate={{ opacity: 1, scale: 1, rotate: 0 }}
									exit={{ opacity: 0, scale: 0.4, rotate: 20 }}
									transition={reduce ? { duration: 0 } : SPRING_SWAP}
									className="flex items-center justify-center"
								>
									<HugeiconsIcon icon={CheckIcon} size={SIZE_ICON[size]} className="stroke-[3]" />
								</motion.span>
							) : null}
						</AnimatePresence>
					</CheckboxPrimitive.Indicator>
				</motion.div>
			</CheckboxPrimitive.Root>
		);
	},
);

MotionCheckbox.displayName = "MotionCheckbox";

export type StatefulCheckboxProps = Omit<MotionCheckboxProps, "checked" | "onCheckedChange"> & {
	defaultChecked?: boolean;
	onToggle?: (checked: boolean) => Promise<boolean | void> | boolean | void;
};

export function StatefulCheckbox({
	defaultChecked = false,
	onToggle,
	disabled,
	...props
}: StatefulCheckboxProps) {
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
		<MotionCheckbox
			checked={checked}
			onCheckedChange={handleChange}
			loading={loading}
			disabled={disabled}
			{...props}
		/>
	);
}
