"use client";

import { ArrowRight01Icon, SecurityLockIcon, UserCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@personal-os/ui/components/badge";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { userInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/users/types/user.types";

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

type AccountPageLayoutProps = {
	user: User;
	basePath: string;
	eyebrow: string;
	title: string;
	description: string;
	status?: ReactNode;
	children: ReactNode;
};

export function AccountPageLayout({
	user,
	basePath,
	eyebrow,
	title,
	description,
	status,
	children,
}: AccountPageLayoutProps) {
	const pathname = usePathname();
	const displayName = user.profile?.displayName || user.username;
	const navigation = [
		{ label: "Profile", href: `${basePath}/profile`, icon: UserCircle02Icon },
		{ label: "Security", href: `${basePath}/security`, icon: SecurityLockIcon },
	];

	return (
		<div className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
			<header className="flex flex-col gap-4 border-dashboard-border border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<p className="mb-1.5 text-[11px] text-dashboard-text-muted uppercase">{eyebrow}</p>
					<h1 className="font-semibold text-[24px] text-dashboard-text-primary leading-tight">
						{title}
					</h1>
					<p className="mt-1 max-w-2xl text-[13px] text-dashboard-text-muted">{description}</p>
				</div>
				{status}
			</header>

			<div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
				<aside className="overflow-hidden rounded-[16px] border border-dashboard-border bg-dashboard-surface lg:sticky lg:top-5">
					<div className="border-dashboard-border border-b p-4">
						<div className="flex items-center gap-3">
							{user.profile?.avatarUrl ? (
								<Image
									src={user.profile.avatarUrl}
									alt=""
									width={48}
									height={48}
									unoptimized
									className="size-12 rounded-lg border border-dashboard-border object-cover"
								/>
							) : (
								<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-dashboard-surface-strong font-semibold text-[16px] text-dashboard-text-primary">
									{userInitials(displayName)}
								</div>
							)}
							<div className="min-w-0">
								<p className="truncate font-semibold text-[14px] text-dashboard-text-primary">
									{displayName}
								</p>
								<p className="truncate text-[12px] text-dashboard-text-muted">{user.email}</p>
							</div>
						</div>
						<div className="mt-3 flex flex-wrap gap-1.5">
							<Badge variant="outline" className="border-dashboard-border text-[11px]">
								{user.emailVerified ? "Email verified" : "Email unverified"}
							</Badge>
							<Badge variant="outline" className="border-dashboard-border text-[11px]">
								{user.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
					</div>

					<nav className="grid grid-cols-2 gap-1 p-2 lg:grid-cols-1" aria-label="Account settings">
						{navigation.map((item) => {
							const active = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex h-9 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors",
										active
											? "bg-dashboard-surface-strong font-medium text-dashboard-text-primary"
											: "text-dashboard-text-secondary hover:bg-dashboard-surface-hover",
									)}
								>
									<HugeiconsIcon icon={item.icon} className="size-4" strokeWidth={1.8} />
									<span>{item.label}</span>
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										className="ml-auto hidden size-3.5 lg:block"
										strokeWidth={1.8}
									/>
								</Link>
							);
						})}
					</nav>
				</aside>

				<div className="min-w-0 space-y-5">{children}</div>
			</div>
		</div>
	);
}

type AccountSectionProps = {
	title: string;
	description: string;
	icon: IconType;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
};

export function AccountSection({
	title,
	description,
	icon,
	action,
	children,
	className,
	bodyClassName,
}: AccountSectionProps) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-[16px] border border-dashboard-border bg-dashboard-surface",
				className,
			)}
		>
			<div className="flex flex-col gap-3 border-dashboard-border border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashboard-border bg-dashboard-surface-elevated text-dashboard-text-secondary">
						<HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.8} />
					</div>
					<div className="min-w-0">
						<h2 className="font-semibold text-[14px] text-dashboard-text-primary">{title}</h2>
						<p className="mt-0.5 text-[12px] text-dashboard-text-muted">{description}</p>
					</div>
				</div>
				{action}
			</div>
			<div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
		</section>
	);
}
