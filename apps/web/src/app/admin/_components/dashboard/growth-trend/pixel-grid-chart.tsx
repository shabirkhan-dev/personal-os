"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
] as const;

const COLS_PER_MONTH = 6;
const COLS = MONTHS.length * COLS_PER_MONTH; // 72
const ROWS = 26;
const MAX_VALUE = 60000;
const PER_ROW = MAX_VALUE / ROWS;
const CELL = 10;
const GAP = 2;
const STEP = CELL + GAP;
const PAD_X = 2;
const PAD_Y = 2;
const CHART_W = COLS * STEP - GAP + PAD_X * 2;
const CHART_H = ROWS * STEP - GAP + PAD_Y * 2;

const COLOR_GRID = "var(--dashboard-chart-grid)";
const COLOR_NEW = "var(--dashboard-accent)";
const COLOR_EXISTING = "var(--dashboard-chart-dot)";

type Col = {
	idx: number;
	monthIdx: number;
	month: string;
	newCells: number;
	existingCells: number;
};

function mulberry32(seed: number) {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function buildColumns(): Col[] {
	const rand = mulberry32(7);
	const cols: Col[] = [];
	for (let i = 0; i < COLS; i++) {
		const monthIdx = Math.floor(i / COLS_PER_MONTH);
		const inner = i % COLS_PER_MONTH;
		const innerPhase = Math.sin(((inner + 0.5) / COLS_PER_MONTH) * Math.PI);
		const exBase = 2.5 + innerPhase * 5 + rand() * 1.5;
		const existingCells = Math.max(1, Math.round(exBase));
		const nuBase = 0.8 + innerPhase * 2.2 + rand();
		const newCells = Math.max(0, Math.round(nuBase));
		cols.push({
			idx: i,
			monthIdx,
			month: MONTHS[monthIdx],
			existingCells,
			newCells,
		});
	}
	return cols;
}

const Y_TICKS = [0, 10000, 20000, 30000, 40000, 50000, 60000];

type Props = {
	highlightMonth?: (typeof MONTHS)[number];
	className?: string;
};

export function PixelGridChart({ highlightMonth = "JUL", className }: Props) {
	const cols = useMemo(() => buildColumns(), []);
	const [hoverCol, setHoverCol] = useState<number | null>(null);

	const highlightIdx = MONTHS.indexOf(highlightMonth);
	const defaultIdx = Math.floor((highlightIdx + 0.5) * COLS_PER_MONTH);
	const activeColIdx = hoverCol ?? defaultIdx;
	const activeCol = cols[activeColIdx];
	const activeMonth = activeCol?.month ?? highlightMonth;

	const monthTotals = useMemo(() => {
		const map = new Map<string, { newSignups: number; returning: number }>();
		for (const c of cols) {
			const cur = map.get(c.month) ?? { newSignups: 0, returning: 0 };
			cur.newSignups += c.newCells * PER_ROW;
			cur.returning += c.existingCells * PER_ROW;
			map.set(c.month, cur);
		}
		return map;
	}, [cols]);

	const tip = monthTotals.get(activeMonth);

	const stackTopRow = ROWS - 1 - (activeCol?.existingCells ?? 0) - (activeCol?.newCells ?? 0);
	const lineX = PAD_X + activeColIdx * STEP + CELL / 2;
	const dotY = PAD_Y + Math.max(stackTopRow, 0) * STEP;
	const lineXPct = (lineX / CHART_W) * 100;
	const dotYPct = (dotY / CHART_H) * 100;
	const tipOnRight = activeColIdx < COLS - 14;

	return (
		<div className={cn("flex flex-col", className)}>
			<div className="flex">
				{/* Y-axis labels with dotted leader lines */}
				<div className="flex w-[68px] shrink-0 flex-col-reverse justify-between py-1">
					{Y_TICKS.map((t) => (
						<div key={t} className="flex items-center gap-1.5 leading-none">
							<span className="w-7 text-right font-medium text-[10.5px] text-dashboard-text-muted">
								{t / 1000}k
							</span>
							<span
								aria-hidden
								className="size-[3px] shrink-0 rounded-full bg-dashboard-chart-dot"
							/>
							<span
								aria-hidden
								className="h-px flex-1"
								style={{
									backgroundImage:
										"repeating-linear-gradient(to right, var(--dashboard-chart-leader) 0 1.5px, transparent 1.5px 4px)",
								}}
							/>
						</div>
					))}
				</div>

				{/* Chart svg + overlay */}
				<div className="relative min-w-0 flex-1">
					<svg
						viewBox={`0 0 ${CHART_W} ${CHART_H}`}
						preserveAspectRatio="xMidYMid meet"
						className="block h-auto w-full"
						role="img"
						aria-label="User growth pixel chart"
					>
						{Array.from({ length: ROWS * COLS }).map((_, idx) => {
							const r = Math.floor(idx / COLS);
							const c = idx % COLS;
							return (
								<rect
									key={`bg-${r}-${c}`}
									x={PAD_X + c * STEP}
									y={PAD_Y + r * STEP}
									width={CELL}
									height={CELL}
									rx={0.75}
									fill={COLOR_GRID}
								/>
							);
						})}

						{cols.map((col) => {
							const startBottom = ROWS - 1;
							const filled: { r: number; color: string }[] = [];
							for (let i = 0; i < col.existingCells; i++) {
								filled.push({ r: startBottom - i, color: COLOR_EXISTING });
							}
							for (let i = 0; i < col.newCells; i++) {
								filled.push({
									r: startBottom - col.existingCells - i,
									color: COLOR_NEW,
								});
							}
							return filled.map((f) => (
								<rect
									key={`fg-${col.idx}-${f.r}-${f.color}`}
									x={PAD_X + col.idx * STEP}
									y={PAD_Y + f.r * STEP}
									width={CELL}
									height={CELL}
									rx={0.75}
									fill={f.color}
								/>
							));
						})}

						{cols.map((col) => (
							// oxlint-disable-next-line jsx_a11y/no-static-element-interactions -- invisible hit area
							<rect
								key={`hit-${col.idx}`}
								x={PAD_X + col.idx * STEP - GAP / 2}
								y={0}
								width={STEP}
								height={CHART_H}
								fill="transparent"
								onMouseEnter={() => setHoverCol(col.idx)}
								onMouseLeave={() => setHoverCol(null)}
								style={{ cursor: "crosshair" }}
							/>
						))}
					</svg>

					{tip && (
						<>
							<div
								className="pointer-events-none absolute top-0 bottom-0 w-px"
								style={{
									left: `${lineXPct}%`,
									backgroundImage:
										"repeating-linear-gradient(to bottom, var(--dashboard-chart-line) 0 2px, transparent 2px 5px)",
								}}
							/>
							<div
								className="pointer-events-none absolute size-2.5 rounded-full border-2 border-dashboard-surface bg-dashboard-tooltip-bg"
								style={{
									left: `${lineXPct}%`,
									top: `${dotYPct}%`,
									transform: "translate(-50%, -50%)",
								}}
							/>
							<div
								className="pointer-events-none absolute z-10 w-[230px] rounded-xl border border-dashboard-border bg-dashboard-tooltip-bg/95 p-2.5 backdrop-blur-sm"
								style={{
									left: `calc(${lineXPct}% + ${tipOnRight ? 18 : -18}px)`,
									top: `${dotYPct}%`,
									transform: tipOnRight ? "translate(0, -50%)" : "translate(-100%, -50%)",
								}}
							>
								<div className="border-dashboard-border-subtle border-b px-3.5 py-2 font-medium text-[14px] text-dashboard-text-secondary">
									{activeMonth.charAt(0) + activeMonth.slice(1).toLowerCase()} 2026
								</div>
								<div className="space-y-2.5 px-3.5 pt-3 pb-2">
									<div className="flex items-center gap-2.5">
										<span
											aria-hidden
											className="size-1.5 rounded-full"
											style={{ backgroundColor: COLOR_NEW }}
										/>
										<span className="text-[13.5px] text-dashboard-text-muted">New signups</span>
										<span className="ml-auto font-semibold text-[15px] text-dashboard-text-primary tabular-nums">
											{Math.round(tip.newSignups / 1000)}k
										</span>
									</div>
									<div className="flex items-center gap-2.5">
										<span
											aria-hidden
											className="size-1.5 rounded-full"
											style={{ backgroundColor: COLOR_EXISTING }}
										/>
										<span className="text-[13.5px] text-dashboard-text-muted">Returning</span>
										<span className="ml-auto font-semibold text-[15px] text-dashboard-text-primary tabular-nums">
											{Math.round(tip.returning / 1000)}k
										</span>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* X-axis month labels — aligned with chart area only */}
			<div className="mt-3 ml-[68px] grid grid-cols-12">
				{MONTHS.map((m, i) => {
					const isActive = i === highlightIdx;
					return (
						<div key={m} className="flex items-center justify-center gap-2">
							<span
								className={cn(
									"font-medium text-[11px]",
									isActive ? "text-dashboard-text-primary" : "text-dashboard-text-muted",
								)}
							>
								{m}
							</span>
							{i < MONTHS.length - 1 && (
								<span aria-hidden className="size-[3px] rounded-full bg-dashboard-text-faint" />
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
