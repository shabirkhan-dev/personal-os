"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardCardFooter, DashboardCardHeader, FooterSep } from "../card-chrome";
import { memberSummary, members } from "./members-data";
import { MembersTable } from "./members-table";
import { MembersToolbar } from "./members-toolbar";

type Props = {
	className?: string;
};

export function RecentMembersCard({ className }: Props) {
	const [query, setQuery] = useState("");
	const summary = useMemo(() => memberSummary(members), []);

	const filteredCount = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return members.length;
		return members.filter((row) =>
			[row.id, row.name, row.email, row.role, row.workspace, row.team, row.status, row.note].some(
				(field) => field.toLowerCase().includes(q),
			),
		).length;
	}, [query]);

	return (
		<section
			className={cn(
				"flex w-full flex-col overflow-hidden rounded-[16px] border border-dashboard-border bg-dashboard-surface shadow-(--dashboard-shadow-card)",
				className,
			)}
			aria-label="Recent members"
		>
			<DashboardCardHeader
				title="Recent Members"
				description="Active team members and workspace invites with role, source, and verification notes."
				meta={`Showing ${filteredCount} of ${summary.total} · updated a few minutes ago`}
				info="Search filters this list only. Status updates sync across active workspaces."
				actions={<MembersToolbar query={query} onQueryChange={setQuery} className="w-full" />}
			/>

			<div className="shrink-0">
				<MembersTable query={query} />
			</div>

			<DashboardCardFooter
				className="shrink-0"
				action={
					<button
						type="button"
						className="inline-flex items-center gap-1 font-medium text-[12px] text-dashboard-accent transition-colors hover:text-dashboard-accent-hover"
					>
						View all members
						<HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2} />
					</button>
				}
			>
				<span>
					<span className="font-semibold text-dashboard-text-secondary">{summary.pending}</span>{" "}
					pending review
				</span>
				<FooterSep />
				<span>
					<span className="font-semibold text-dashboard-text-secondary">{summary.waitlisted}</span>{" "}
					suspended
				</span>
				<FooterSep />
				<span>
					<span className="font-semibold text-dashboard-text-secondary">{summary.enrolled}</span>{" "}
					active members
				</span>
			</DashboardCardFooter>
		</section>
	);
}
