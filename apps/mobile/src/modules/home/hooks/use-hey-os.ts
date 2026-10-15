import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { haptics } from "@/lib/haptics";
import { useWakeListener } from "@/lib/voice";
import { useHeyOsSettings, useHeyOsStatus } from "../store/hey-os";

/**
 * "Hey OS" while the app is open: listens when it is on, the app is in front and Talk to OS is
 * not already showing, then opens Talk to OS with whatever was said after the phrase.
 */
export function useHeyOs(): void {
	const enabled = useHeyOsSettings((state) => state.data.enabled);
	const hydrated = useHeyOsSettings((state) => state.hydrated);
	const pathname = usePathname();
	const [foreground, setForeground] = useState(AppState.currentState === "active");

	useEffect(() => {
		if (!hydrated) void useHeyOsSettings.getState().hydrate();
	}, [hydrated]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) =>
			setForeground(state === "active"),
		);
		return () => subscription.remove();
	}, []);

	const status = useWakeListener(enabled && foreground && pathname !== "/listen", (rest) => {
		haptics.success();
		router.push(rest ? { pathname: "/listen", params: { say: rest } } : "/listen");
	});

	useEffect(() => {
		useHeyOsStatus.setState({ status });
	}, [status]);
}
