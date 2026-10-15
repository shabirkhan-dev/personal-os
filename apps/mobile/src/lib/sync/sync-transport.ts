import { apiClient } from "@/lib/api/client";
import type { SyncRequest, SyncResponse, SyncTransport } from "./sync-engine";

/** `POST /sync` with the current access token. */
export function apiTransport(getToken: () => string | null): SyncTransport {
	return (request: SyncRequest) => {
		const accessToken = getToken();
		if (!accessToken) return Promise.reject(new Error("Not signed in"));
		return apiClient.post<SyncResponse>("/sync", request, { accessToken });
	};
}
