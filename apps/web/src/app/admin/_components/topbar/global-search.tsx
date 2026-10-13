"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
	placeholder?: string;
	className?: string;
};

export function GlobalSearch({
	placeholder = "Search workspaces, users, pages...",
	className,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div
			className={cn(
				"group flex h-9 items-center gap-2 rounded-lg border border-dashboard-border-subtle bg-dashboard-surface px-3 transition-colors focus-within:border-dashboard-border-focus hover:border-dashboard-border",
				className,
			)}
		>
			<HugeiconsIcon
				icon={Search01Icon}
				size={16}
				strokeWidth={1.8}
				className="shrink-0 text-dashboard-text-muted transition-colors group-focus-within:text-dashboard-text-secondary"
			/>
			<input
				ref={inputRef}
				type="text"
				placeholder={placeholder}
				className="flex-1 bg-transparent text-[13px] text-dashboard-text-primary placeholder:text-dashboard-text-muted focus:outline-none"
			/>
			<kbd className="pointer-events-none flex h-5 select-none items-center gap-0.5 rounded-md border border-dashboard-border-strong bg-dashboard-hover px-1.5 font-medium text-[10.5px] text-dashboard-text-muted">
				<span className="text-[11px]">⌘</span>K
			</kbd>
		</div>
	);
}
