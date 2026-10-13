"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { userFirstName } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { DatePill } from "./date-pill";
import { ExportButton } from "./export-button";
import { PeriodSelect } from "./period-select";

type Props = {
	name?: string;
	className?: string;
	onExport?: () => void;
};

export function DashboardHeader({ name, className, onExport }: Props) {
	const { user } = useAuth();
	const greetingName = name ?? (user ? userFirstName(user.username) : "there");
	const [{ today, todayLong }] = useState(() => {
		const now = new Date();
		return {
			today: now.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
			}),
			todayLong: now.toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
			}),
		};
	});

	return (
		<section
			className={cn(
				"flex flex-col gap-3 border-dashboard-border border-b pb-4 sm:gap-4 sm:pb-5 md:flex-row md:items-end md:justify-between",
				className,
			)}
		>
			<div className="min-w-0">
				<div className="mb-1.5 flex items-center gap-2 text-[11px] text-dashboard-text-muted uppercase tracking-[0.08em]">
					<span className="size-1.5 rounded-full bg-emerald-500" />
					<span className="sm:hidden">Live · Production</span>
					<span className="hidden sm:inline">Live overview · Production</span>
				</div>
				<h1 className="font-semibold text-[22px] text-dashboard-text-primary leading-tight tracking-tight sm:text-[24px]">
					Welcome back, {greetingName}
				</h1>
				<p className="mt-1.5 text-[13px] text-dashboard-text-secondary leading-5 sm:hidden">
					{today} · Workspace throughput and active sessions.
				</p>
				<p className="mt-1.5 hidden max-w-xl text-[13px] text-dashboard-text-secondary leading-5 sm:block">
					{todayLong} · All services operating normally across production and staging environments.
				</p>
				<p className="mt-1 hidden text-[12px] text-dashboard-text-dim sm:block">
					Role: Workspace Admin · Data synchronized with production cluster
				</p>
			</div>

			<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
				<PeriodSelect className="w-full justify-between sm:w-auto sm:justify-center" />
				<div className="flex gap-2">
					<DatePill className="min-w-0 flex-1 justify-center sm:flex-none" />
					<ExportButton onClick={onExport} className="shrink-0 justify-center px-3" />
				</div>
			</div>
		</section>
	);
}
