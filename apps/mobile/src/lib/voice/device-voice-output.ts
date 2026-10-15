import { requireOptionalNativeModule } from "expo";
import type * as ExpoSpeech from "expo-speech";
import type { SpeakOptions, VoiceOutput } from "./voice";

type SpeechModule = typeof ExpoSpeech;

/** The native module, or null in a build without it, so older builds stay silent instead of crashing. */
const native = requireOptionalNativeModule("ExpoSpeech")
	? (require("expo-speech") as SpeechModule)
	: null;

/** Voice out on the phone itself: the system text-to-speech voices (Google or Apple). */
export const deviceVoiceOutput: VoiceOutput = {
	available: native !== null,
	speak: (text: string, options: SpeakOptions = {}) => {
		if (!native || !text.trim()) return;
		native.stop();
		native.speak(text, {
			...(options.lang ? { language: options.lang } : {}),
			rate: options.rate ?? 1,
			onDone: options.onDone,
			onStopped: options.onDone,
			onError: (error) => {
				console.warn("[voice] speaking failed", error);
				options.onDone?.();
			},
		});
	},
	stop: () => {
		native?.stop();
	},
};
