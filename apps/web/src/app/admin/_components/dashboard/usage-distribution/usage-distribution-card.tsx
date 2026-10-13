"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { DashboardCardFooter, DashboardCardHeader, FooterSep, InsightStat } from "../card-chrome";
import { AiInsightButton } from "./ai-insight-button";
import { DateRangePill } from "./date-range-pill";
import { UsageChart } from "./usage-chart";

type Props = {
	className?: string;
};

export function UsageDistributionCard({ className }: Props) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-[16px] border border-dashboard-border bg-dashboard-surface shadow-(--dashboard-shadow-card)",
				className,
			)}
			aria-label="Active user distribution"
		>
			<DashboardCardHeader
				title="Active User Distribution"
				description="Monthly active users from Jan–Dec across all workspaces."
				meta="CY 2026 · all workspaces"
				info="Hover a bar for exact active user count. Distribution reflects verified sessions."
				actions={<DateRangePill label="CY 2026" />}
			/>

			<div className="p-3 sm:p-5">
				<div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
					<InsightStat
						label="Active this year"
						value="2,847"
						hint="Peak in Mar · stable through Q4"
					/>
					<div className="w-full rounded-[12px] border border-dashboard-border-subtle bg-dashboard-surface/70 px-3 py-2.5 text-[12px] text-dashboard-text-muted leading-4 sm:w-auto sm:max-w-[200px]">
						<div className="font-medium text-[11px] text-dashboard-text-dim uppercase tracking-[0.05em]">
							Watch
						</div>
						<p className="mt-1 text-dashboard-text-secondary">
							Staging workspace at 98% concurrency quota — scaling auto-triggers.
						</p>
					</div>
				</div>

				<p className="mb-2 text-[11px] text-dashboard-text-dim sm:hidden">
					Swipe chart horizontally
				</p>
				<div className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
					<div className="min-w-[300px]">
						<UsageChart />
					</div>
				</div>

				<AiInsightButton
					label="Get AI insight on user distribution"
					className="mt-5"
					disabled
					title="AI insights connect after Nest AI assist is enabled"
				/>
			</div>

			<DashboardCardFooter
				action={
					<button
						type="button"
						className="inline-flex items-center gap-1 font-medium text-[12px] text-dashboard-accent transition-colors hover:text-dashboard-accent-hover"
					>
						Full breakdown
						<HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2} />
					</button>
				}
			>
				<span>
					Avg <span className="font-semibold text-dashboard-text-secondary">237</span>/month
				</span>
				<FooterSep />
				<span>
					Spread <span className="font-semibold text-dashboard-text-secondary">71</span> users
				</span>
			</DashboardCardFooter>
		</section>
	);
}
