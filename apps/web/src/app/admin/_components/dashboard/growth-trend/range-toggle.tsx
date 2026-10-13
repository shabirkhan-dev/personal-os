"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Range = "Weekly" | "Monthly" | "Yearly";

const ranges: { value: Range; short: string }[] = [
	{ value: "Weekly", short: "Wk" },
	{ value: "Monthly", short: "Mo" },
	{ value: "Yearly", short: "Yr" },
];

type Props = {
	value?: Range;
	onChange?: (r: Range) => void;
	className?: string;
};

export function RangeToggle({ value: controlled, onChange, className }: Props) {
	const [internal, setInternal] = useState<Range>("Monthly");
	const value = controlled ?? internal;

	return (
		<fieldset
			className={cn(
				"m-0 inline-flex h-8 w-full items-center gap-0.5 rounded-lg border border-dashboard-border bg-dashboard-surface-elevated p-0.5 sm:w-auto",
				className,
			)}
		>
			<legend className="sr-only">Time range</legend>
			{ranges.map((r) => {
				const active = r.value === value;
				return (
					<button
						key={r.value}
						type="button"
						onClick={() => {
							setInternal(r.value);
							onChange?.(r.value);
						}}
						className={cn(
							"h-7 flex-1 rounded-md px-2 font-medium text-[11px] transition-all sm:flex-none sm:px-3 sm:text-[12px]",
							active
								? "border border-dashboard-border-strong bg-dashboard-surface-hover text-dashboard-text-primary"
								: "text-dashboard-text-muted hover:text-dashboard-text-primary",
						)}
					>
						<span className="sm:hidden">{r.short}</span>
						<span className="hidden sm:inline">{r.value}</span>
					</button>
				);
			})}
		</fieldset>
	);
}
