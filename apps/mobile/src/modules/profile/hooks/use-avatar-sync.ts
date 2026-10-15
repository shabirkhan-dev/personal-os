import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuth } from "@/modules/auth";
import { uploadPendingAvatar } from "../services/avatar";
import { useAvatarStore } from "../store/avatar-store";

/** Uploads a photo picked offline once the person is signed in and online. */
export function useAvatarSync(): void {
	const { status, token, updateUser } = useAuth();
	const pending = useAvatarStore((state) => state.data.pending);
	const hydrated = useAvatarStore((state) => state.hydrated);

	useEffect(() => {
		if (!hydrated) void useAvatarStore.getState().hydrate();
	}, [hydrated]);

	useEffect(() => {
		if (status !== "signed-in" || !token || !pending) return;
		let alive = true;
		const run = () => {
			uploadPendingAvatar(token)
				.then((outcome) => {
					if (alive && outcome?.status === "uploaded") updateUser(outcome.user);
				})
				.catch((error: unknown) => console.warn("[profile] avatar sync failed", error));
		};
		run();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") run();
		});
		return () => {
			alive = false;
			subscription.remove();
		};
	}, [status, token, pending, updateUser]);
}
