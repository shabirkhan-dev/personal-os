"use client";

import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type Props = {
	className?: string;
	query: string;
	onQueryChange: (value: string) => void;
	onAdd?: () => void;
};

export function MembersToolbar({ className, query, onQueryChange, onAdd }: Props) {
	return (
		<div className={cn("flex w-full items-center gap-2 sm:w-auto", className)}>
			<div className="group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-surface px-3 transition-colors focus-within:border-dashboard-border-focus hover:border-dashboard-border-strong sm:flex-none">
				<HugeiconsIcon
					icon={Search01Icon}
					size={15}
					strokeWidth={1.8}
					className="text-dashboard-text-muted transition-colors group-focus-within:text-dashboard-text-secondary"
				/>
				<input
					type="search"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="Search members..."
					aria-label="Search members"
					className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-dashboard-text-primary placeholder:text-dashboard-text-muted focus:outline-none sm:w-[240px] sm:flex-none"
				/>
			</div>

			<button
				type="button"
				onClick={onAdd}
				disabled={!onAdd}
				title={onAdd ? "Invite member" : "Invite workflow coming soon"}
				className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-dashboard-accent px-3 font-semibold text-[12.5px] text-dashboard-accent-fg transition-all hover:bg-dashboard-accent-hover enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55 sm:px-3.5"
			>
				<HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.4} />
				<span className="sm:hidden">Invite</span>
				<span className="hidden sm:inline">Invite member</span>
			</button>
		</div>
	);
}
