"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

export function ModulePageHeader({
	eyebrow,
	title,
	description,
	icon,
	action,
}: {
	eyebrow: string;
	title: string;
	description: string;
	icon: IconType;
	action?: React.ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 border-dashboard-border border-b px-3 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-surface text-dashboard-accent">
					<HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.8} />
				</div>
				<div className="min-w-0">
					<p className="text-[11px] text-dashboard-text-muted uppercase">{eyebrow}</p>
					<h1 className={cn("font-semibold text-[22px] text-dashboard-text-primary leading-tight")}>
						{title}
					</h1>
					<p className="mt-0.5 max-w-2xl text-[13px] text-dashboard-text-muted">{description}</p>
				</div>
			</div>
			{action}
		</header>
	);
}
