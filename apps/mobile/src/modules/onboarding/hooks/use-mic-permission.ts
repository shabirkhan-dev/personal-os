import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { deviceSpeechModule as speech } from "@/lib/voice";

export type MicPermission = "unknown" | "granted" | "ask" | "blocked" | "unavailable";

/** The microphone permission, read on mount and asked for on `request`. */
export function useMicPermission(): { state: MicPermission; request: () => Promise<boolean> } {
	const [state, setState] = useState<MicPermission>(speech ? "unknown" : "unavailable");

	useEffect(() => {
		if (!speech) return;
		let live = true;
		speech
			.getPermissionsAsync()
			.then((permission) => {
				if (!live) return;
				setState(permission.granted ? "granted" : permission.canAskAgain ? "ask" : "blocked");
			})
			.catch((error: unknown) => console.error("Could not read microphone permission", error));
		return () => {
			live = false;
		};
	}, []);

	const request = useCallback(async () => {
		if (!speech) return false;
		if (state === "blocked") {
			await Linking.openSettings();
			return false;
		}
		const permission = await speech.requestPermissionsAsync();
		setState(permission.granted ? "granted" : permission.canAskAgain ? "ask" : "blocked");
		return permission.granted;
	}, [state]);

	return { state, request };
}
