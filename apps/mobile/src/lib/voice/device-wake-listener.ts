import type {
	ExpoSpeechRecognitionErrorEvent,
	ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { speech } from "./device-speech-module";
import { speechOwner } from "./speech-owner";
import { afterWakePhrase, heardWakePhrase } from "./wake-phrase";

export type WakeStatus = "off" | "unavailable" | "denied" | "listening" | "paused" | "error";

/** Waits this long after another mic lets go before listening again. */
const RESUME_MS = 1500;
/** How long a wake leaves the recogniser to Talk to OS before listening again. */
const HANDOVER_MS = 8000;
/** After a failure, waits this long, doubling up to the cap, before trying again. */
const RETRY_MS = 3000;
const RETRY_CAP_MS = 60_000;
const CONTINUOUS =
	Platform.OS === "ios" || (typeof Platform.Version === "number" && Platform.Version >= 33);

/**
 * Listens for "Hey OS" with the phone's own recogniser while `enabled`, and calls `onWake` with
 * anything said after it. It never fights another mic: when the ask bar or Talk to OS takes the
 * recogniser it pauses, and resumes once that is done. On-device recognition is used when the
 * phone has it, so nothing leaves the phone while it waits.
 */
export function useDeviceWakeListener(
	enabled: boolean,
	onWake: (rest: string) => void,
): WakeStatus {
	const [status, setStatus] = useState<WakeStatus>(enabled ? "paused" : "off");
	const id = useRef<symbol>(Symbol("wake"));
	const wake = useRef(onWake);
	useEffect(() => {
		wake.current = onWake;
	});

	useEffect(() => {
		if (!enabled) {
			setStatus("off");
			return;
		}
		if (!speech) {
			setStatus("unavailable");
			return;
		}
		const recogniser = speech;
		let active = true;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let delay = RETRY_MS;
		let onDevice = recogniser.supportsOnDeviceRecognition();
		/** After a wake, Talk to OS gets the recogniser first; listening waits until then. */
		let holdUntil = 0;
		const mine = () => speechOwner.is(id.current);

		const later = (ms: number) => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				void listen();
			}, ms);
		};

		const listen = async () => {
			if (!active) return;
			if (speechOwner.current() !== null && !mine()) {
				setStatus("paused");
				return;
			}
			try {
				if (!recogniser.isRecognitionAvailable()) {
					setStatus("unavailable");
					return;
				}
				const permission = await recogniser.getPermissionsAsync();
				if (!permission.granted) {
					setStatus("denied");
					return;
				}
				if (!active || (speechOwner.current() !== null && !mine())) return;
				speechOwner.claim(id.current);
				recogniser.start({
					lang: "en-US",
					interimResults: true,
					continuous: CONTINUOUS,
					requiresOnDeviceRecognition: onDevice,
					addsPunctuation: false,
					iosTaskHint: "confirmation",
				});
			} catch (error) {
				console.warn("[wake] could not start listening", error);
				speechOwner.release(id.current);
				setStatus("error");
				later(delay);
				delay = Math.min(RETRY_CAP_MS, delay * 2);
			}
		};

		const subscriptions = [
			recogniser.addListener("start", () => {
				if (!mine()) return;
				delay = RETRY_MS;
				setStatus("listening");
			}),
			recogniser.addListener("result", (event: ExpoSpeechRecognitionResultEvent) => {
				if (!mine()) return;
				const text = event.results[0]?.transcript ?? "";
				if (!heardWakePhrase(text)) return;
				// Hand the recogniser over before waking, so Talk to OS can take it straight away.
				recogniser.abort();
				holdUntil = Date.now() + HANDOVER_MS;
				speechOwner.release(id.current);
				setStatus("paused");
				wake.current(afterWakePhrase(text));
			}),
			recogniser.addListener("error", (event: ExpoSpeechRecognitionErrorEvent) => {
				if (!mine()) return;
				if (
					event.error === "no-speech" ||
					event.error === "aborted" ||
					event.error === "speech-timeout"
				)
					return;
				if (event.error === "not-allowed") {
					speechOwner.release(id.current);
					setStatus("denied");
					return;
				}
				if (onDevice && (event.error === "language-not-supported" || event.error === "network")) {
					// No offline language pack: fall back to the regular recogniser.
					onDevice = false;
					return;
				}
				console.warn("[wake] recogniser error", event.error, event.message);
				setStatus("error");
				delay = Math.min(RETRY_CAP_MS, delay * 2);
			}),
			recogniser.addListener("end", () => {
				if (!mine()) return;
				speechOwner.release(id.current);
				if (active) later(Math.max(delay === RETRY_MS ? 300 : delay, holdUntil - Date.now()));
			}),
		];

		// Resume once whoever took the recogniser lets it go.
		const unsubscribe = speechOwner.subscribe((owner) => {
			if (!active) return;
			if (owner === null) later(Math.max(RESUME_MS, holdUntil - Date.now()));
			else if (owner !== id.current) setStatus("paused");
		});

		void listen();

		return () => {
			active = false;
			if (timer) clearTimeout(timer);
			unsubscribe();
			for (const subscription of subscriptions) subscription.remove();
			if (speechOwner.is(id.current)) {
				recogniser.abort();
				speechOwner.release(id.current);
			}
		};
	}, [enabled]);

	return status;
}
