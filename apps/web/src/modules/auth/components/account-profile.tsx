"use client";

import {
	Calendar03Icon,
	CheckmarkCircle02Icon,
	Mail01Icon,
	UserEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, AlertTitle } from "@personal-os/ui/components/alert";
import { Badge } from "@personal-os/ui/components/badge";
import { Spinner } from "@personal-os/ui/components/spinner";
import { useEffect, useState } from "react";
import { ProfileForm } from "@/modules/users/components/profile-form";
import {
	useUpdateUserProfileMutation,
	useUploadAvatarMutation,
} from "@/modules/users/hooks/use-user-mutations";
import { useCurrentUserQuery } from "@/modules/users/hooks/use-user-queries";
import type { UpdateUserProfileInput } from "@/modules/users/types/user.types";
import { AccountPageLayout, AccountSection } from "./account-page-layout";

export function AccountProfile({ basePath = "/admin/account" }: { basePath?: string }) {
	const currentUser = useCurrentUserQuery();
	const update = useUpdateUserProfileMutation();
	const uploadAvatar = useUploadAvatarMutation();
	const user = currentUser.data;
	const [form, setForm] = useState<UpdateUserProfileInput>({});

	useEffect(() => {
		if (!user) return;
		setForm({
			username: user.username,
			displayName: user.profile?.displayName ?? null,
			avatarUrl: user.profile?.avatarUrl ?? null,
			bio: user.profile?.bio ?? null,
			timezone: user.profile?.timezone ?? null,
			locale: user.profile?.locale ?? null,
		});
	}, [user]);

	if (!user)
		return (
			<div className="flex min-h-48 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);

	return (
		<AccountPageLayout
			user={user}
			basePath={basePath}
			eyebrow="Account settings"
			title="Profile"
			description="Control how your identity appears across workspaces and shared activity."
			status={
				<Badge
					variant="outline"
					className="h-7 border-dashboard-border bg-dashboard-surface px-2.5 text-dashboard-text-secondary"
				>
					<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={1.8} />
					Profile active
				</Badge>
			}
		>
			{update.isError || uploadAvatar.isError ? (
				<Alert variant="destructive">
					<AlertTitle>Could not update profile</AlertTitle>
					<AlertDescription>
						{(update.error ?? uploadAvatar.error)?.message ?? "Something went wrong"}
					</AlertDescription>
				</Alert>
			) : null}
			{update.isSuccess || uploadAvatar.isSuccess ? (
				<Alert>
					<AlertTitle>Profile updated</AlertTitle>
					<AlertDescription>Your changes are now active.</AlertDescription>
				</Alert>
			) : null}
			<AccountSection
				title="Public profile"
				description="Presentation details are separate from your sign-in identity."
				icon={UserEdit01Icon}
			>
				<ProfileForm
					value={form}
					pending={update.isPending}
					uploadingAvatar={uploadAvatar.isPending}
					onChange={setForm}
					onUploadAvatar={(file) => {
						uploadAvatar.mutate(file, {
							onSuccess: (next) => {
								setForm((current) => ({
									...current,
									avatarUrl: next.profile?.avatarUrl ?? null,
								}));
							},
						});
					}}
					onSubmit={(event) => {
						event.preventDefault();
						update.mutate(form);
					}}
				/>
			</AccountSection>

			<AccountSection
				title="Account identity"
				description="Read-only details used for authentication and account recovery."
				icon={Mail01Icon}
				bodyClassName="p-0 sm:p-0"
			>
				<dl className="divide-y divide-dashboard-border">
					<div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:px-5">
						<dt className="text-[12px] text-dashboard-text-muted">Email address</dt>
						<dd className="break-all text-[13px] text-dashboard-text-primary">{user.email}</dd>
					</div>
					<div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:px-5">
						<dt className="text-[12px] text-dashboard-text-muted">Email status</dt>
						<dd className="flex items-center gap-1.5 text-[13px] text-dashboard-text-primary">
							<HugeiconsIcon
								icon={CheckmarkCircle02Icon}
								className="size-3.5 text-emerald-500"
								strokeWidth={1.8}
							/>
							{user.emailVerified ? "Verified" : "Verification required"}
						</dd>
					</div>
					<div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:px-5">
						<dt className="text-[12px] text-dashboard-text-muted">Member since</dt>
						<dd className="flex items-center gap-1.5 text-[13px] text-dashboard-text-primary">
							<HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={1.8} />
							{new Date(user.createdAt).toLocaleDateString(undefined, {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</dd>
					</div>
				</dl>
			</AccountSection>
		</AccountPageLayout>
	);
}
