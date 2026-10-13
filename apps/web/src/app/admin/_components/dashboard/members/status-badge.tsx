"use client";

import { AlertCircleIcon, CheckmarkCircle02Icon, ReloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "./members-data";

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

type StatusSpec = {
	label: string;
	icon: IconType;
	className: string;
};

const SPECS: Record<MemberStatus, StatusSpec> = {
	active: {
		label: "Active",
		icon: CheckmarkCircle02Icon,
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	},
	pending: {
		label: "Pending",
		icon: AlertCircleIcon,
		className: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
	suspended: {
		label: "Suspended",
		icon: ReloadIcon,
		className: "border-dashboard-border bg-dashboard-surface-strong text-dashboard-text-secondary",
	},
};

type Props = {
	status: MemberStatus;
	className?: string;
};

export function StatusBadge({ status, className }: Props) {
	const spec = SPECS[status];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-[11px]",
				spec.className,
				className,
			)}
		>
			<HugeiconsIcon icon={spec.icon} size={12} strokeWidth={2} />
			{spec.label}
		</span>
	);
}
