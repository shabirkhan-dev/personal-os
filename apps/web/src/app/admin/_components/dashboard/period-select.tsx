"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@personal-os/ui/components/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";

const periods: Period[] = ["Daily", "Weekly", "Monthly", "Yearly"];

type Props = {
	value?: Period;
	onChange?: (value: Period) => void;
	className?: string;
};

export function PeriodSelect({ value: controlled, onChange, className }: Props) {
	const [internal, setInternal] = useState<Period>("Daily");
	const value = controlled ?? internal;

	const handleSelect = (next: Period) => {
		setInternal(next);
		onChange?.(next);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(props) => (
					<button
						type="button"
						{...props}
						className={cn(
							"group flex h-9 items-center gap-2 rounded-lg border border-dashboard-border-subtle bg-dashboard-surface px-3 text-[13px] text-dashboard-text-secondary transition-colors hover:border-dashboard-border-strong hover:bg-dashboard-surface-hover",
							className,
						)}
					>
						<span className="font-medium">{value}</span>
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							size={14}
							strokeWidth={2}
							className="text-dashboard-text-muted transition-transform group-data-popup-open:rotate-180"
						/>
					</button>
				)}
			/>
			<DropdownMenuContent
				align="end"
				sideOffset={6}
				className="w-[140px] border-dashboard-border bg-dashboard-surface text-dashboard-text-secondary"
			>
				{periods.map((p) => (
					<DropdownMenuItem
						key={p}
						onClick={() => handleSelect(p)}
						className={cn(
							"text-[13px] focus:bg-dashboard-hover-strong",
							p === value && "font-medium text-dashboard-text-primary",
						)}
					>
						{p}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
