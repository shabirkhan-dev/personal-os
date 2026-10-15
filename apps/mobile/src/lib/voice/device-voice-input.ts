import type {
	ExpoSpeechRecognitionErrorEvent,
	ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import { speech } from "./device-speech-module";
import { speechOwner } from "./speech-owner";
import type { VoiceInput, VoiceStatus } from "./voice";

/** Waveform bars kept on screen, newest last. */
export const LEVEL_COUNT = 34;
/** A long introduction takes about a minute; stop after this so the mic is never left on. */
const MAX_SECONDS = 90;
/** Android 12 and older end recognition at the first pause, so it is restarted until stopped. */
const CONTINUOUS =
	Platform.OS === "ios" || (typeof Platform.Version === "number" && Platform.Version >= 33);

function join(a: string, b: string): string {
	const left = a.trim();
	const right = b.trim();
	return left && right ? `${left} ${right}` : left || right;
}

/** Voice in on the phone itself: Google (Android) or Apple (iOS) speech recognition. */
export function useDeviceVoiceInput(lang = "en-US"): VoiceInput {
	const [status, setStatus] = useState<VoiceStatus>(speech ? "idle" : "unavailable");
	const [committed, setCommitted] = useState("");
	const [pending, setPending] = useState("");
	const [levels, setLevels] = useState<number[]>(() => Array(LEVEL_COUNT).fill(0));
	const [seconds, setSeconds] = useState(0);
	/** True while the person wants the mic on; native "end" restarts only then. */
	const wanted = useRef(false);
	/** This hook's claim on the phone's one recogniser (see speech-owner). */
	const id = useRef<symbol>(Symbol("voice-input"));
	const pendingRef = useRef("");
	const hold = useCallback((text: string) => {
		pendingRef.current = text;
		setPending(text);
	}, []);

	const begin = useCallback(() => {
		speech?.start({
			lang,
			interimResults: true,
			continuous: CONTINUOUS,
			addsPunctuation: true,
			volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
		});
	}, [lang]);

	const stop = useCallback(() => {
		wanted.current = false;
		if (speechOwner.is(id.current)) speech?.stop();
	}, []);

	const start = useCallback(async () => {
		if (!speech) return;
		try {
			if (!speech.isRecognitionAvailable()) {
				setStatus("unavailable");
				return;
			}
			setStatus("starting");
			const permission = await speech.requestPermissionsAsync();
			if (!permission.granted) {
				setStatus("denied");
				return;
			}
			wanted.current = true;
			speechOwner.claim(id.current);
			begin();
		} catch (error) {
			console.error("Speech recognition failed to start", error);
			wanted.current = false;
			setStatus("error");
		}
	}, [begin]);

	useEffect(() => {
		if (!speech) return;
		const subscriptions = [
			speech.addListener("start", () => {
				if (speechOwner.is(id.current)) setStatus("listening");
			}),
			speech.addListener("result", (event: ExpoSpeechRecognitionResultEvent) => {
				if (!speechOwner.is(id.current)) return;
				const text = event.results[0]?.transcript ?? "";
				if (event.isFinal) {
					setCommitted((value) => join(value, text));
					hold("");
				} else {
					hold(text);
				}
			}),
			speech.addListener("volumechange", ({ value }: { value: number }) => {
				if (!speechOwner.is(id.current)) return;
				const level = Math.min(1, Math.max(0, (value + 2) / 12));
				setLevels((bars) => [...bars.slice(1 - LEVEL_COUNT), level]);
			}),
			speech.addListener("error", (event: ExpoSpeechRecognitionErrorEvent) => {
				if (!speechOwner.is(id.current)) return;
				if (event.error === "aborted" || event.error === "no-speech") return;
				wanted.current = false;
				if (event.error === "not-allowed") setStatus("denied");
				else {
					console.error("Speech recognition error", event.error, event.message);
					setStatus("error");
				}
			}),
			speech.addListener("end", () => {
				if (!speechOwner.is(id.current)) return;
				// Keep what was still being recognised when the recogniser stopped.
				const text = pendingRef.current;
				if (text) setCommitted((value) => join(value, text));
				hold("");
				if (wanted.current) begin();
				else {
					speechOwner.release(id.current);
					setStatus((current) =>
						current === "listening" || current === "starting" ? "stopped" : current,
					);
				}
			}),
		];
		return () => {
			for (const subscription of subscriptions) subscription.remove();
		};
	}, [begin, hold]);

	useEffect(() => {
		if (status !== "listening") return;
		const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
		return () => clearInterval(timer);
	}, [status]);

	useEffect(() => {
		if (seconds >= MAX_SECONDS) stop();
	}, [seconds, stop]);

	// Someone else took the recogniser (Talk to OS, another mic): this one has stopped.
	useEffect(
		() =>
			speechOwner.subscribe((owner) => {
				if (owner !== id.current && wanted.current) {
					wanted.current = false;
					setStatus((current) =>
						current === "listening" || current === "starting" ? "stopped" : current,
					);
				}
			}),
		[],
	);

	useEffect(
		() => () => {
			wanted.current = false;
			if (speechOwner.is(id.current)) {
				speech?.abort();
				speechOwner.release(id.current);
			}
		},
		[],
	);

	const openSettings = useCallback(() => {
		Linking.openSettings().catch((error: unknown) => {
			console.error("Could not open settings", error);
		});
	}, []);

	const reset = useCallback(() => {
		setCommitted("");
		hold("");
		setSeconds(0);
	}, [hold]);

	return {
		status,
		transcript: join(committed, pending),
		levels,
		seconds,
		start,
		stop,
		reset,
		openSettings,
	};
}
