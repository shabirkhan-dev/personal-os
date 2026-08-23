"use client";

import { Sun03Icon, TaskDone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@school-os/ui/components/badge";
import { Button } from "@school-os/ui/components/button";
import { Card, CardContent } from "@school-os/ui/components/card";
import { Checkbox } from "@school-os/ui/components/checkbox";
import Link from "next/link";

export function TodayView({
	view,
	loading,
	togglingItemId,
	onToggle,
}: {
	view:
		| {
				date: string;
				timeZone: string;
				routines: Array<{
					id: string;
					name: string;
					description: string | null;
					completedItems: number;
					totalItems: number;
					items: Array<{
						id: string;
						name: string;
						targetTime: string | null;
						completed: boolean;
					}>;
				}>;
		  }
		| undefined;
	loading: boolean;
	togglingItemId: string | null;
	onToggle: (routineId: string, itemId: string) => void;
}) {
	if (loading) {
		return <p className="text-dashboard-text-muted text-[13px]">Loading your day…</p>;
	}

	if (!view) {
		return <p className="text-dashboard-text-muted text-[13px]">Could not load today.</p>;
	}

	const totalItems = view.routines.reduce((sum, routine) => sum + routine.totalItems, 0);
	const completedItems = view.routines.reduce((sum, routine) => sum + routine.completedItems, 0);
	const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

	return (
		<div className="space-y-5">
			<Card>
				<CardContent className="flex items-center gap-4">
					<div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-accent-soft text-dashboard-accent">
						<HugeiconsIcon icon={Sun03Icon} className="size-5" strokeWidth={1.8} />
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="font-semibold text-[16px] text-dashboard-text-primary">
							{formatDate(view.date)}
						</h2>
						<p className="mt-0.5 text-[12px] text-dashboard-text-muted">
							{totalItems === 0
								? "Nothing scheduled today."
								: `${completedItems} of ${totalItems} done · ${progress}%`}
						</p>
						<div
							className="mt-2 h-1.5 overflow-hidden rounded-full bg-dashboard-surface-strong"
							role="progressbar"
							aria-valuenow={progress}
							aria-valuemin={0}
							aria-valuemax={100}
						>
							<div
								className="h-full rounded-full bg-dashboard-accent transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{view.routines.length === 0 && (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<div className="flex size-11 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-surface-strong text-dashboard-text-muted">
							<HugeiconsIcon icon={TaskDone01Icon} className="size-5" strokeWidth={1.8} />
						</div>
						<p className="text-[13px] text-dashboard-text-secondary">
							No routines scheduled for today.
						</p>
						<Button variant="outline" size="sm" render={<Link href="/admin/routines" />}>
							Manage routines
						</Button>
					</CardContent>
				</Card>
			)}

			{view.routines.map((routine) => {
				const allDone = routine.totalItems > 0 && routine.completedItems === routine.totalItems;
				return (
					<Card key={routine.id}>
						<CardContent className="space-y-1">
							<div className="flex items-center justify-between gap-3 pb-2">
								<div className="flex min-w-0 items-center gap-2.5">
									<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashboard-border bg-dashboard-surface-elevated text-dashboard-text-secondary">
										<HugeiconsIcon icon={TaskDone01Icon} className="size-4" strokeWidth={1.8} />
									</div>
									<div className="min-w-0">
										<h3 className="truncate font-semibold text-[14px] text-dashboard-text-primary">
											{routine.name}
										</h3>
										{routine.description && (
											<p className="truncate text-[12px] text-dashboard-text-muted">
												{routine.description}
											</p>
										)}
									</div>
								</div>
								<Badge
									variant="outline"
									className={
										allDone
											? "border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400"
											: "border-dashboard-border text-[11px]"
									}
								>
									{routine.completedItems}/{routine.totalItems}
								</Badge>
							</div>
							<ul>
								{routine.items.map((item) => {
									const pending = togglingItemId === item.id;
									return (
										<li key={item.id}>
											<div className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-dashboard-hover">
												<Checkbox
													checked={item.completed}
													disabled={pending}
													onCheckedChange={() => onToggle(routine.id, item.id)}
													aria-label={`Mark ${item.name} ${item.completed ? "incomplete" : "complete"}`}
												/>
												<button
													type="button"
													onClick={() => onToggle(routine.id, item.id)}
													className="flex-1 text-left"
												>
													<span
														className={
															item.completed
																? "text-[13px] text-dashboard-text-muted line-through"
																: "text-[13px] text-dashboard-text-secondary"
														}
													>
														{item.name}
													</span>
												</button>
												{item.targetTime && (
													<span className="text-[11px] text-dashboard-text-dim">
														{item.targetTime}
													</span>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

function formatDate(isoDate: string): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	if (!year || !month || !day) return isoDate;
	return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}
