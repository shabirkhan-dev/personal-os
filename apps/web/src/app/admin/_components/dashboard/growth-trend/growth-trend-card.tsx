"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { DashboardCardFooter, DashboardCardHeader, FooterSep, InsightStat } from "../card-chrome";
import { LegendDot } from "./legend-dot";
import { PixelGridChart } from "./pixel-grid-chart";
import { RangeToggle } from "./range-toggle";

type Props = {
	className?: string;
};

export function GrowthTrendCard({ className }: Props) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-[16px] border border-dashboard-border bg-dashboard-surface shadow-(--dashboard-shadow-card)",
				className,
			)}
			aria-label="User growth trend"
		>
			<DashboardCardHeader
				title="User Growth Trend"
				description="New user signups versus active returning users across workspaces."
				meta="Q3 metrics · all workspaces"
				info="Each column cluster is a month. Accent cells are new users; muted cells are recurring cohort."
				actions={<RangeToggle className="w-full sm:w-auto" />}
			/>

			<div className="min-w-0 p-3 sm:p-5">
				<div className="mb-4 grid grid-cols-2 gap-4 sm:mb-5 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
					<div className="col-span-2 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-8 lg:grid-cols-none">
						<InsightStat
							label="Total active users"
							value="2,847"
							hint="+118 net since Jan · target 3,500"
						/>
						<InsightStat label="New this month" value="142" hint="Jul peak · 38 pending invites" />
						<InsightStat
							label="Retention"
							value="96.1%"
							hint="Recurring vs prior month"
							className="col-span-2 sm:col-span-1"
						/>
					</div>
					<div className="col-span-2 flex flex-wrap items-center gap-3 sm:gap-4 sm:pt-1">
						<LegendDot color="var(--dashboard-accent)" label="New signups" />
						<LegendDot color="var(--dashboard-chart-dot)" label="Recurring" />
					</div>
				</div>

				<div className="mb-3 rounded-[12px] border border-dashboard-border-subtle bg-dashboard-surface/70 px-3 py-2.5 text-[12.5px] text-dashboard-text-secondary leading-5 sm:mb-4 sm:px-3.5">
					<span className="font-medium text-dashboard-text-primary">July spike:</span> self-serve
					onboarding drove +19% new users vs June. All provisioned clusters are operating within
					quota.
				</div>

				<p className="mb-2 text-[11px] text-dashboard-text-dim md:hidden">
					Swipe chart horizontally
				</p>
				<div className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
					<PixelGridChart highlightMonth="JUL" className="min-w-[520px] sm:min-w-[560px]" />
				</div>
			</div>

			<DashboardCardFooter
				action={
					<button
						type="button"
						className="inline-flex items-center gap-1 font-medium text-[12px] text-dashboard-accent transition-colors hover:text-dashboard-accent-hover"
					>
						Growth analytics
						<HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2} />
					</button>
				}
			>
				<span>
					<span className="font-semibold text-dashboard-text-secondary">653</span> seats open
				</span>
				<FooterSep />
				<span>
					<span className="font-semibold text-dashboard-text-secondary">99.9%</span> uptime
				</span>
				<FooterSep />
				<span className="hidden sm:inline">Updated 14:02</span>
			</DashboardCardFooter>
		</section>
	);
}
