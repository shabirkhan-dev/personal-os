import * as z from "zod";

export const updateProfileSchema = z
	.object({
		displayName: z.string().trim().max(100).nullable().optional(),
		/** A key from `POST /assets/uploads` (after the upload), or null to remove the avatar. */
		avatarKey: z.string().max(200).nullable().optional(),
	})
	.strict()
	.refine((input) => Object.keys(input).length > 0, "Send at least one field");

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** The account as the app sees it. */
export type PublicUser = {
	id: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
	createdAt: string;
};
