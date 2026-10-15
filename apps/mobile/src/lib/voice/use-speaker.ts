import { useCallback, useEffect, useRef, useState } from "react";
import { voiceOut } from "./engines";

export type SpeechPart = { text: string; lang?: string; rate?: number };

/**
 * Reads one or more parts aloud in turn (an ayah in Arabic, then its translation) and tracks
 * which item is speaking, so a button can show Stop. Speech stops when the screen goes away.
 */
export function useSpeaker() {
	const [speaking, setSpeaking] = useState<string | null>(null);
	const run = useRef(0);

	const stop = useCallback(() => {
		run.current += 1;
		voiceOut.stop();
		setSpeaking(null);
	}, []);

	const speak = useCallback((id: string, parts: readonly SpeechPart[]) => {
		const current = ++run.current;
		const queue = parts.filter((part) => part.text.trim());
		setSpeaking(id);
		const next = (index: number) => {
			const part = queue[index];
			if (current !== run.current) return;
			if (!part) {
				setSpeaking(null);
				return;
			}
			voiceOut.speak(part.text, {
				...(part.lang ? { lang: part.lang } : {}),
				rate: part.rate ?? 0.95,
				onDone: () => next(index + 1),
			});
		};
		next(0);
	}, []);

	useEffect(() => () => voiceOut.stop(), []);

	return { available: voiceOut.available, speaking, speak, stop };
}
