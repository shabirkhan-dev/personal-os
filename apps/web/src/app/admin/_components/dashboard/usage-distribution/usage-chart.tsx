"use client";

import { cn } from "@/lib/utils";

const BAR_W = 4;
const CHART_H = 240;
const PAD_TOP = 14;
const LABEL_H = 26;

const COLOR_DOT = "var(--dashboard-chart-dot)";
const DOT_SIZE = 5;
const DASHED_BG =
	"repeating-linear-gradient(to right, var(--dashboard-chart-leader) 0 2px, transparent 2px 6px)";

type MetricPoint = { label: string; count: number };

const POINTS: MetricPoint[] = [
	{ label: "Jan", count: 266 },
	{ label: "Feb", count: 258 },
	{ label: "Mar", count: 272 },
	{ label: "Apr", count: 252 },
	{ label: "May", count: 240 },
	{ label: "Jun", count: 234 },
	{ label: "Jul", count: 250 },
	{ label: "Aug", count: 244 },
	{ label: "Sep", count: 224 },
	{ label: "Oct", count: 212 },
	{ label: "Nov", count: 200 },
	{ label: "Dec", count: 195 },
];

const MAX = Math.max(...POINTS.map((g) => g.count));
const GRID_LEVELS = [0, 0.2, 0.4, 0.6, 0.8, 1];

type Props = {
	className?: string;
};

export function UsageChart({ className }: Props) {
	const inner = CHART_H - PAD_TOP - LABEL_H;

	return (
		<div className={cn("flex w-full flex-col", className)}>
			<div className="relative w-full" style={{ height: CHART_H }}>
				{/* horizontal grid lines: left dot + dotted leader only */}
				{GRID_LEVELS.map((g) => (
					<div
						key={g}
						className="absolute right-0 left-0 flex items-center"
						style={{
							top: PAD_TOP + inner * (1 - g) - DOT_SIZE / 2,
							height: DOT_SIZE,
						}}
					>
						<span
							aria-hidden
							className="shrink-0 rounded-full"
							style={{
								width: DOT_SIZE,
								height: DOT_SIZE,
								backgroundColor: COLOR_DOT,
							}}
						/>
						<span aria-hidden className="h-px flex-1" style={{ backgroundImage: DASHED_BG }} />
					</div>
				))}

				{/* bars with month labels */}
				<div
					className="absolute inset-0 flex items-stretch justify-between px-3"
					style={{ paddingTop: PAD_TOP }}
				>
					{POINTS.map((p) => (
						<div key={p.label} className="flex flex-col items-center justify-end">
							<span
								className="rounded-full bg-dashboard-accent transition-colors hover:bg-dashboard-accent-hover"
								style={{
									width: BAR_W,
									height: inner * (0.4 + 0.6 * (p.count / MAX)),
								}}
								title={`${p.label}: ${p.count} active users`}
							/>
							<span className="mt-2 font-medium text-[10px] text-dashboard-text-dim">
								{p.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
