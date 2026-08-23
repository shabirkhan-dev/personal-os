import { SaveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@personal-os/ui/components/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@personal-os/ui/components/field";
import { Input } from "@personal-os/ui/components/input";
import { Spinner } from "@personal-os/ui/components/spinner";
import { Textarea } from "@personal-os/ui/components/textarea";
import type { UpdateUserProfileInput } from "../types/user.types";
import { AvatarPicker } from "./avatar-picker";

export function ProfileForm({
	value,
	pending,
	uploadingAvatar,
	onChange,
	onSubmit,
	onUploadAvatar,
}: {
	value: UpdateUserProfileInput;
	pending: boolean;
	uploadingAvatar?: boolean;
	onChange: (value: UpdateUserProfileInput) => void;
	onSubmit: (event: React.FormEvent) => void;
	onUploadAvatar: (file: File) => void;
}) {
	const seed = value.username?.trim() || value.displayName?.trim() || "personal-os";

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup className="gap-5">
				<div className="grid gap-5 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="profile-name">Display name</FieldLabel>
						<Input
							id="profile-name"
							className="h-9"
							value={value.displayName ?? ""}
							onChange={(event) => onChange({ ...value, displayName: event.target.value || null })}
							maxLength={100}
							autoComplete="name"
							placeholder="How your name appears"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="profile-username">Username</FieldLabel>
						<Input
							id="profile-username"
							className="h-9"
							value={value.username ?? ""}
							onChange={(event) => onChange({ ...value, username: event.target.value })}
							minLength={3}
							maxLength={64}
							autoComplete="username"
							required
						/>
						<FieldDescription>Your unique account handle.</FieldDescription>
					</Field>
				</div>
				<Field>
					<FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
					<Textarea
						id="profile-bio"
						className="min-h-24 resize-y"
						value={value.bio ?? ""}
						onChange={(event) => onChange({ ...value, bio: event.target.value || null })}
						maxLength={280}
						placeholder="A short introduction"
					/>
					<FieldDescription>{(value.bio ?? "").length}/280 characters</FieldDescription>
				</Field>

				<AvatarPicker
					seed={seed}
					value={value.avatarUrl}
					pending={pending}
					uploading={uploadingAvatar}
					onSelectTemplate={(url) => onChange({ ...value, avatarUrl: url })}
					onUploadFile={onUploadAvatar}
				/>

				<div className="grid gap-5 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="profile-timezone">Timezone</FieldLabel>
						<Input
							id="profile-timezone"
							className="h-9"
							value={value.timezone ?? ""}
							onChange={(event) => onChange({ ...value, timezone: event.target.value || null })}
							placeholder="America/Los_Angeles"
							maxLength={64}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="profile-locale">Locale</FieldLabel>
						<Input
							id="profile-locale"
							className="h-9"
							value={value.locale ?? ""}
							onChange={(event) => onChange({ ...value, locale: event.target.value || null })}
							placeholder="en-US"
							maxLength={16}
						/>
					</Field>
				</div>
				<div className="flex flex-col gap-3 border-dashboard-border border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-[12px] text-dashboard-text-muted">
						Your profile updates across every workspace.
					</p>
					<Button type="submit" disabled={pending || uploadingAvatar} className="sm:min-w-32">
						{pending ? (
							<Spinner data-icon="inline-start" />
						) : (
							<HugeiconsIcon icon={SaveIcon} data-icon="inline-start" strokeWidth={1.8} />
						)}
						Save changes
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}
