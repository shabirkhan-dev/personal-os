export type SyncDirection = "push" | "pull" | "none";

/**
 * Which way to sync the onboarding answers after signing in: the side that changed last wins.
 * A device that does not know when its answers changed (saved before tracking existed) defers to
 * the server when the server has a copy.
 */
export function syncDirection(
	localUpdatedAt: string | null,
	remoteUpdatedAt: string | null,
): SyncDirection {
	if (!remoteUpdatedAt) return "push";
	if (!localUpdatedAt) return "pull";
	const local = Date.parse(localUpdatedAt);
	const remote = Date.parse(remoteUpdatedAt);
	if (Number.isNaN(local)) return "pull";
	if (Number.isNaN(remote) || local > remote) return "push";
	if (remote > local) return "pull";
	return "none";
}
