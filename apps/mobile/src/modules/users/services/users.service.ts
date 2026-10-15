import { ApiError, apiClient } from "@/lib/api/client";
import type { AvatarType, UpdateUserProfileInput, UploadTicket, User } from "../types/user.types";

export const usersService = {
	getCurrent: (accessToken: string) => apiClient.get<User>("/users/me", { accessToken }),
	updateProfile: (accessToken: string, input: UpdateUserProfileInput) =>
		apiClient.patch<User>("/users/me/profile", input, { accessToken }),

	/**
	 * Uploads a picked image straight to R2 with a presigned URL, then saves its key. The image
	 * never goes through the API; only the key does.
	 */
	async uploadAvatar(accessToken: string, file: { uri: string; type: AvatarType }): Promise<User> {
		const ticket = await apiClient.post<UploadTicket>(
			"/assets/uploads",
			{ kind: "avatar", contentType: file.type },
			{ accessToken },
		);
		const image = await (await fetch(file.uri)).blob();
		const upload = await fetch(ticket.uploadUrl, {
			method: ticket.method,
			headers: ticket.headers,
			body: image,
		});
		if (!upload.ok) {
			throw new ApiError(
				"The image could not be uploaded. Try again.",
				upload.status,
				"UPLOAD_FAILED",
			);
		}
		return usersService.updateProfile(accessToken, { avatarKey: ticket.key });
	},
};
