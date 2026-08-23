"use client";

import { Notification03Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@personal-os/ui/components/tooltip";
import Link from "next/link";
import type { ComponentProps } from "react";
import { ThemeToggleControl } from "@/components/motion/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { userInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

type IconBtnProps = {
	icon: IconType;
	label: string;
	dot?: boolean;
	onClick?: () => void;
	className?: string;
};

function IconButton({ icon, label, dot, onClick, className }: IconBtnProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={(props) => (
					<button
						type="button"
						{...props}
						onClick={onClick}
						aria-label={label}
						className={cn(
							"relative flex size-9 items-center justify-center rounded-lg text-dashboard-text-muted transition-all hover:bg-dashboard-hover hover:text-dashboard-text-primary active:scale-95",
							className,
						)}
					>
						<HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
						{dot && (
							<span
								aria-hidden
								className="absolute top-1.5 right-1.5 block size-2 rounded-full bg-dashboard-accent ring-2 ring-dashboard-bg"
							/>
						)}
					</button>
				)}
			/>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

type Props = {
	avatarSrc?: string;
	avatarFallback?: string;
	unreadNotifications?: boolean;
	className?: string;
};

export function TopbarActions({
	avatarSrc,
	avatarFallback,
	unreadNotifications = true,
	className,
}: Props) {
	const { user } = useAuth();
	const initials = avatarFallback ?? (user ? userInitials(user.username) : "?");

	return (
		<div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
			{/* Do not wrap the menu control in Tooltip — Base UI tooltip + menu fight for focus. */}
			<ThemeToggleControl />
			<IconButton icon={Notification03Icon} label="Notifications" dot={unreadNotifications} />
			<IconButton icon={PrinterIcon} label="Print" className="hidden sm:flex" />

			<Link
				href="/admin/account/profile"
				aria-label="Profile"
				className="ml-1 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-zinc-600 to-zinc-800 font-semibold text-[12px] text-dashboard-text-primary ring-1 ring-dashboard-border-strong transition-all hover:ring-dashboard-border-focus active:scale-95"
			>
				{avatarSrc ? (
					// biome-ignore lint/performance/noImgElement: simple avatar, no next/image wrap needed here
					<img src={avatarSrc} alt="Account" className="size-full object-cover" />
				) : (
					<span>{initials}</span>
				)}
			</Link>
		</div>
	);
}
