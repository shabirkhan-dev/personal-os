/**
 * The voice layer: what the app needs from voice in and voice out, independent of the engine.
 * Today both run on the phone (see `engines.ts`); a cloud engine (Whisper, a better voice) or the
 * desktop app's engine implements the same shapes and is switched in `engines.ts` alone.
 */

export type VoiceStatus =
	| "idle"
	| "starting"
	| "listening"
	| "stopped"
	| "denied"
	| "unavailable"
	| "error";

/** Live speech to text. */
export type VoiceInput = {
	status: VoiceStatus;
	/** Everything heard so far, including words still being recognised. */
	transcript: string;
	/** 0–1 loudness, one per waveform bar (`LEVEL_COUNT` of them). */
	levels: number[];
	seconds: number;
	start: () => Promise<void>;
	stop: () => void;
	/** Forgets the transcript, for a fresh utterance. */
	reset: () => void;
	openSettings: () => void;
};

export type SpeakOptions = {
	/** BCP-47, e.g. "en-US", "ar", "ur-PK". */
	lang?: string;
	/** 1 is normal speed. */
	rate?: number;
	onDone?: () => void;
};

/** Text to speech. */
export type VoiceOutput = {
	available: boolean;
	speak: (text: string, options?: SpeakOptions) => void;
	stop: () => void;
};
