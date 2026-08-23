"use client";

import {
	ArrowLeft01Icon,
	Cancel01Icon,
	Delete02Icon,
	PlusSignIcon,
	TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@school-os/ui/components/badge";
import { Button } from "@school-os/ui/components/button";
import { Card, CardContent } from "@school-os/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@school-os/ui/components/field";
import { Input } from "@school-os/ui/components/input";
import { Spinner } from "@school-os/ui/components/spinner";
import { useState } from "react";
import type {
	CreateRoutineInput,
	Routine,
	RoutineScheduleType,
	UpdateRoutineInput,
} from "../types/routine.types";

const WEEKDAYS = [
	{ iso: 1, label: "Mon" },
	{ iso: 2, label: "Tue" },
	{ iso: 3, label: "Wed" },
	{ iso: 4, label: "Thu" },
	{ iso: 5, label: "Fri" },
	{ iso: 6, label: "Sat" },
	{ iso: 7, label: "Sun" },
];

interface RoutineFormItem {
	id: string;
	name: string;
}

interface RoutineFormValue {
	name: string;
	description: string;
	scheduleType: RoutineScheduleType;
	daysOfWeek: number[];
	items: RoutineFormItem[];
}

function newItem(): RoutineFormItem {
	return { id: crypto.randomUUID(), name: "" };
}

function emptyForm(): RoutineFormValue {
	return {
		name: "",
		description: "",
		scheduleType: "daily",
		daysOfWeek: [],
		items: [newItem()],
	};
}

function formFromRoutine(routine: Routine): RoutineFormValue {
	return {
		name: routine.name,
		description: routine.description ?? "",
		scheduleType: routine.scheduleType,
		daysOfWeek: [...routine.daysOfWeek],
		items: routine.items.map((item) => ({ id: crypto.randomUUID(), name: item.name })),
	};
}

export function RoutineManager({
	routines,
	loading,
	createPending,
	updatePending,
	onCreate,
	onUpdate,
	onArchive,
}: {
	routines: Routine[] | undefined;
	loading: boolean;
	createPending: boolean;
	updatePending: boolean;
	onCreate: (input: CreateRoutineInput) => Promise<unknown>;
	onUpdate: (id: string, input: UpdateRoutineInput) => Promise<unknown>;
	onArchive: (id: string) => Promise<unknown>;
}) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState<RoutineFormValue>(emptyForm);
	const [error, setError] = useState<string | null>(null);

	const busy = createPending || updatePending;

	function startCreate() {
		setEditingId(null);
		setCreating(true);
		setError(null);
		setForm(emptyForm());
	}

	function startEdit(routine: Routine) {
		setCreating(false);
		setEditingId(routine.id);
		setError(null);
		setForm(formFromRoutine(routine));
	}

	function cancel() {
		setCreating(false);
		setEditingId(null);
		setError(null);
	}

	async function submit() {
		const items = form.items
			.map((item) => ({ ...item, name: item.name.trim() }))
			.filter((item) => item.name.length > 0);
		if (!form.name.trim()) {
			setError("Give your routine a name.");
			return;
		}
		if (form.scheduleType === "specific_days" && form.daysOfWeek.length === 0) {
			setError("Pick at least one weekday.");
			return;
		}

		try {
			if (editingId) {
				await onUpdate(editingId, {
					name: form.name.trim(),
					description: form.description || null,
					scheduleType: form.scheduleType,
					daysOfWeek: form.scheduleType === "specific_days" ? sortUnique(form.daysOfWeek) : [],
					items,
				});
			} else {
				await onCreate({
					name: form.name.trim(),
					description: form.description || null,
					scheduleType: form.scheduleType,
					daysOfWeek: form.scheduleType === "specific_days" ? sortUnique(form.daysOfWeek) : [],
					items,
				});
			}
			cancel();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Something went wrong");
		}
	}

	if (loading) {
		return (
			<div className="flex justify-center py-10">
				<Spinner className="size-6" />
			</div>
		);
	}

	const showForm = creating || editingId !== null;

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<p className="text-[13px] text-dashboard-text-muted">
					{routines?.length ?? 0} active routine{(routines?.length ?? 0) === 1 ? "" : "s"}
				</p>
				{!showForm && (
					<Button size="sm" onClick={startCreate}>
						<HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
						New routine
					</Button>
				)}
			</div>

			{showForm && (
				<Card>
					<CardContent className="space-y-5">
						<div className="flex items-center gap-2 text-[13px] font-semibold text-dashboard-text-primary">
							<Button variant="ghost" size="icon-sm" onClick={cancel} aria-label="Cancel editing">
								<HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
							</Button>
							{editingId ? "Edit routine" : "New routine"}
						</div>

						<div className="grid gap-5 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="routine-name">Name</FieldLabel>
								<Input
									id="routine-name"
									className="h-9"
									value={form.name}
									onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
									placeholder="Morning routine"
									maxLength={120}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="routine-description">Description</FieldLabel>
								<Input
									id="routine-description"
									className="h-9"
									value={form.description}
									onChange={(event) =>
										setForm((value) => ({ ...value, description: event.target.value }))
									}
									placeholder="Optional notes"
									maxLength={500}
								/>
							</Field>
						</div>

						<Field>
							<FieldLabel>Schedule</FieldLabel>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant={form.scheduleType === "daily" ? "default" : "outline"}
									onClick={() =>
										setForm((value) => ({ ...value, scheduleType: "daily", daysOfWeek: [] }))
									}
								>
									Every day
								</Button>
								<Button
									type="button"
									size="sm"
									variant={form.scheduleType === "specific_days" ? "default" : "outline"}
									onClick={() => setForm((value) => ({ ...value, scheduleType: "specific_days" }))}
								>
									Specific days
								</Button>
							</div>
							{form.scheduleType === "specific_days" && (
								<>
									<FieldDescription>Pick the days this routine repeats.</FieldDescription>
									<div className="flex flex-wrap gap-1.5 pt-1">
										{WEEKDAYS.map((day) => {
											const selected = form.daysOfWeek.includes(day.iso);
											return (
												<button
													key={day.iso}
													type="button"
													onClick={() =>
														setForm((value) => ({
															...value,
															daysOfWeek: selected
																? value.daysOfWeek.filter((d) => d !== day.iso)
																: [...value.daysOfWeek, day.iso],
														}))
													}
													aria-pressed={selected}
													className={`h-8 rounded-md border px-3 text-[12px] transition-colors ${
														selected
															? "border-dashboard-accent bg-dashboard-accent-soft font-medium text-dashboard-accent"
															: "border-dashboard-border text-dashboard-text-muted hover:bg-dashboard-hover"
													}`}
												>
													{day.label}
												</button>
											);
										})}
									</div>
								</>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="routine-items">Steps</FieldLabel>
							<FieldDescription>The things you check off each time.</FieldDescription>
							<div className="space-y-2 pt-1">
								{form.items.map((item, index) => (
									<div key={item.id} className="flex items-center gap-2">
										<Input
											className="h-9"
											value={item.name}
											onChange={(event) =>
												setForm((value) => ({
													...value,
													items: value.items.map((existing, i) =>
														i === index ? { ...existing, name: event.target.value } : existing,
													),
												}))
											}
											placeholder={`Step ${index + 1}`}
											maxLength={200}
											aria-label={`Step ${index + 1}`}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											disabled={form.items.length === 1}
											onClick={() =>
												setForm((value) => ({
													...value,
													items: value.items.filter((_, i) => i !== index),
												}))
											}
											aria-label={`Remove step ${index + 1}`}
										>
											<HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
										</Button>
									</div>
								))}
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={() =>
									setForm((value) => ({ ...value, items: [...value.items, newItem()] }))
								}
							>
								<HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
								Add step
							</Button>
						</Field>

						{error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}

						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" size="sm" onClick={cancel}>
								Cancel
							</Button>
							<Button type="button" size="sm" disabled={busy} onClick={() => void submit()}>
								{busy && <Spinner className="size-4" />}
								{editingId ? "Save changes" : "Create routine"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{!showForm && routines?.length === 0 && (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<div className="flex size-11 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-surface-strong text-dashboard-text-muted">
							<HugeiconsIcon icon={TaskDone01Icon} className="size-5" strokeWidth={1.8} />
						</div>
						<p className="text-[13px] text-dashboard-text-secondary">
							No routines yet. Create your first one.
						</p>
					</CardContent>
				</Card>
			)}

			{!showForm &&
				routines?.map((routine) => (
					<Card key={routine.id}>
						<CardContent className="space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="truncate font-semibold text-[14px] text-dashboard-text-primary">
										{routine.name}
									</h3>
									{routine.description && (
										<p className="mt-0.5 line-clamp-2 text-[12px] text-dashboard-text-muted">
											{routine.description}
										</p>
									)}
								</div>
								<Badge variant="outline" className="shrink-0 border-dashboard-border text-[11px]">
									{describeSchedule(routine)}
								</Badge>
							</div>

							<ul className="space-y-1">
								{routine.items.map((item) => (
									<li
										key={item.id}
										className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-dashboard-text-secondary"
									>
										<span aria-hidden className="size-1.5 rounded-full bg-dashboard-accent/60" />
										{item.name}
									</li>
								))}
								{routine.items.length === 0 && (
									<li className="px-2 py-1 text-[12px] text-dashboard-text-dim">No steps yet.</li>
								)}
							</ul>

							<div className="flex justify-end gap-2 border-dashboard-border-subtle border-t pt-3">
								<Button variant="ghost" size="sm" onClick={() => startEdit(routine)}>
									Edit
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
									onClick={() => {
										void onArchive(routine.id).catch(() => {});
									}}
								>
									<HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
									Archive
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
		</div>
	);
}

function describeSchedule(routine: Pick<Routine, "scheduleType" | "daysOfWeek">): string {
	if (routine.scheduleType === "daily") return "Every day";
	const labels = WEEKDAYS.filter((day) => routine.daysOfWeek.includes(day.iso)).map(
		(day) => day.label,
	);
	return labels.join(", ") || "Specific days";
}

function sortUnique(values: number[]): number[] {
	return [...new Set(values)].sort((a, b) => a - b);
}
