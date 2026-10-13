"use client";

import { ArrowDown01Icon, ArrowUp01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type Member, members as seedMembers } from "./members-data";
import { StatusBadge } from "./status-badge";

type SortKey = "id" | "name" | "role" | "team" | "date" | "status" | "workspace";

type Col = {
	id: SortKey | "actions";
	label: string;
	sortable?: boolean;
	width: string;
};

const COLUMNS: Col[] = [
	{ id: "name", label: "Member", sortable: true, width: "34%" },
	{ id: "workspace", label: "Workspace", sortable: true, width: "14%" },
	{ id: "team", label: "Team", sortable: true, width: "22%" },
	{ id: "date", label: "Joined", sortable: true, width: "14%" },
	{ id: "status", label: "Status", sortable: true, width: "12%" },
	{ id: "actions", label: "Actions", width: "52px" },
];

const SOURCE_LABEL: Record<Member["source"], string> = {
	portal: "Self-serve",
	"walk-in": "Direct invite",
	referral: "Workspace invite",
	transfer: "SSO / SAML",
};

type Props = {
	className?: string;
	query?: string;
};

function compareMembers(a: Member, b: Member, key: SortKey): number {
	return String(a[key]).localeCompare(String(b[key]), undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

function initials(name: string): string {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function useMemberRows(query: string, sortKey: SortKey, sortDir: "asc" | "desc") {
	return useMemo(() => {
		const q = query.trim().toLowerCase();
		const filtered = q
			? seedMembers.filter((row) =>
					[
						row.id,
						row.name,
						row.email,
						row.role,
						row.workspace,
						row.team,
						row.status,
						row.source,
						row.note,
					].some((field) => field.toLowerCase().includes(q)),
				)
			: seedMembers;

		const sorted = filtered.toSorted((a, b) => compareMembers(a, b, sortKey));
		if (sortDir === "desc") sorted.reverse();
		return sorted;
	}, [query, sortDir, sortKey]);
}

export function MembersTable({ className, query = "" }: Props) {
	const [sortKey, setSortKey] = useState<SortKey>("date");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const rows = useMemberRows(query, sortKey, sortDir);

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
			return;
		}
		setSortKey(key);
		setSortDir(key === "date" ? "desc" : "asc");
	};

	if (rows.length === 0) {
		return (
			<div className={cn("px-4 py-10 text-center", className)}>
				<p className="font-medium text-[14px] text-dashboard-text-primary">No matching members</p>
				<p className="mx-auto mt-1 max-w-sm text-[12.5px] text-dashboard-text-muted leading-5">
					Nothing matches “{query.trim()}”. Try a member name, workspace, or status.
				</p>
			</div>
		);
	}

	return (
		<div className={cn("min-w-0", className)}>
			{/* Phone: stacked cards — avoids 760px min-width table scroll */}
			<ul className="divide-y divide-dashboard-border-subtle md:hidden">
				{rows.map((a) => (
					<li key={a.id} className="px-4 py-3.5">
						<MemberMobileCard member={a} />
					</li>
				))}
			</ul>

			{/* Tablet+: fixed table */}
			<div className="hidden min-w-0 overflow-x-auto overscroll-x-contain md:block">
				<table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-[13px]">
					<colgroup>
						{COLUMNS.map((col) => (
							<col key={col.id} style={{ width: col.width }} />
						))}
					</colgroup>
					<thead>
						<tr className="text-left">
							{COLUMNS.map((col) => (
								<th
									key={col.id}
									className="py-2.5 pr-3 font-medium text-[11px] text-dashboard-text-muted uppercase tracking-[0.06em] first:pl-4 last:pr-3"
								>
									{col.sortable ? (
										<button
											type="button"
											onClick={() => toggleSort(col.id as SortKey)}
											className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-dashboard-text-secondary"
											aria-label={`Sort by ${col.label}`}
										>
											{col.label}
											<HugeiconsIcon
												icon={
													sortKey === col.id
														? sortDir === "asc"
															? ArrowUp01Icon
															: ArrowDown01Icon
														: ArrowDown01Icon
												}
												size={12}
												strokeWidth={2}
												className={cn(
													sortKey === col.id
														? "text-dashboard-text-secondary"
														: "text-dashboard-text-faint opacity-50",
												)}
											/>
										</button>
									) : (
										<span className="sr-only">{col.label || "Actions"}</span>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((a, i) => (
							<tr
								key={a.id}
								className={cn(
									"group/row transition-colors hover:bg-dashboard-hover",
									i > 0 && "border-dashboard-border-subtle [&>td]:border-t",
								)}
							>
								{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
								<td className="py-3 pr-3 pl-4 align-top">
									<div className="flex min-w-0 items-start gap-2.5">
										<span
											aria-hidden
											className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-surface-strong font-semibold text-[11px] text-dashboard-text-secondary ring-1 ring-dashboard-border"
										>
											{initials(a.name)}
										</span>
										<span className="min-w-0">
											<span className="block truncate font-semibold text-[13px] text-dashboard-text-primary">
												{a.name}
											</span>
											<span className="mt-0.5 block truncate text-[12px] text-dashboard-text-muted">
												{a.id} · {a.role} · {SOURCE_LABEL[a.source]}
											</span>
											<span className="mt-0.5 block truncate text-[11.5px] text-dashboard-text-secondary">
												{a.note}
											</span>
										</span>
									</div>
								</td>
								<td className="py-3 pr-3 align-top">
									<span className="block truncate font-medium text-[12.5px] text-dashboard-text-primary">
										{a.workspace}
									</span>
									<span className="mt-0.5 block truncate text-[11.5px] text-dashboard-text-muted">
										{a.role}
									</span>
								</td>
								<td className="py-3 pr-3 align-top">
									<span className="block truncate font-medium text-[12.5px] text-dashboard-text-primary">
										{a.team}
									</span>
									<span className="mt-0.5 block truncate text-[11.5px] text-dashboard-text-muted">
										{a.teamRole} · {a.location}
									</span>
								</td>
								<td className="py-3 pr-3 align-top tabular-nums">
									<span className="block text-[12.5px] text-dashboard-text-primary">{a.date}</span>
									<span className="mt-0.5 block truncate text-[11.5px] text-dashboard-text-muted">
										{SOURCE_LABEL[a.source]}
									</span>
								</td>
								<td className="py-3 pr-3 align-top">
									<StatusBadge status={a.status} />
								</td>
								<td className="py-3 pr-3 align-top">
									<button
										type="button"
										aria-label={`Actions for ${a.name}`}
										title="Open member detail"
										className="flex size-7 items-center justify-center rounded-md border border-dashboard-border-strong bg-dashboard-surface text-dashboard-text-muted transition-colors hover:border-dashboard-border-focus hover:text-dashboard-text-primary"
									>
										<HugeiconsIcon icon={MoreHorizontalIcon} size={13} strokeWidth={2} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function MemberMobileCard({ member: a }: { member: Member }) {
	return (
		<article className="flex gap-3">
			<span
				aria-hidden
				className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-dashboard-surface-strong font-semibold text-[12px] text-dashboard-text-secondary ring-1 ring-dashboard-border"
			>
				{initials(a.name)}
			</span>
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="truncate font-semibold text-[14px] text-dashboard-text-primary">
							{a.name}
						</p>
						<p className="mt-0.5 text-[12px] text-dashboard-text-muted">
							{a.id} · {a.role}
						</p>
					</div>
					<StatusBadge status={a.status} className="shrink-0" />
				</div>

				<dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
					<div>
						<dt className="text-[10.5px] text-dashboard-text-dim uppercase tracking-[0.05em]">
							Workspace
						</dt>
						<dd className="mt-0.5 font-medium text-dashboard-text-secondary">{a.workspace}</dd>
					</div>
					<div>
						<dt className="text-[10.5px] text-dashboard-text-dim uppercase tracking-[0.05em]">
							Joined
						</dt>
						<dd className="mt-0.5 font-medium text-dashboard-text-secondary tabular-nums">
							{a.date}
						</dd>
					</div>
					<div className="col-span-2">
						<dt className="text-[10.5px] text-dashboard-text-dim uppercase tracking-[0.05em]">
							Team
						</dt>
						<dd className="mt-0.5 text-dashboard-text-secondary">
							<span className="font-medium">{a.team}</span>
							<span className="text-dashboard-text-muted">
								{" "}
								· {a.teamRole} · {a.location}
							</span>
						</dd>
					</div>
				</dl>

				<p className="text-[12px] text-dashboard-text-secondary leading-4">
					<span className="text-dashboard-text-muted">{SOURCE_LABEL[a.source]} · </span>
					{a.note}
				</p>
			</div>
		</article>
	);
}
