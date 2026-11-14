import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { usePoTheme } from "@/theme";
import { runAutoBackup } from "../services/backup";

/** Writes the daily backup (when it's on) shortly after the app opens or comes back. */
export function useAutoBackup(): void {
	const { preference } = usePoTheme();
	useEffect(() => {
		if (Platform.OS === "web") return;
		const backup = () =>
			runAutoBackup(preference).catch((error: unknown) =>
				console.warn("[backup] automatic backup didn't run", error),
			);
		const timer = setTimeout(backup, 8000);
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") void backup();
		});
		return () => {
			clearTimeout(timer);
			subscription.remove();
		};
	}, [preference]);
}
