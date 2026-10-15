/**
 * The phone has one speech recogniser. Whoever started it last owns it: only the owner reacts
 * to its events, and only the owner may stop it. The "Hey OS" listener steps aside whenever
 * something else (the ask bar's mic, Talk to OS) takes it, and resumes once it is free again.
 */
export type SpeechOwner = symbol;

let owner: SpeechOwner | null = null;
const listeners = new Set<(owner: SpeechOwner | null) => void>();

function notify(): void {
	for (const listener of listeners) listener(owner);
}

export const speechOwner = {
	current: (): SpeechOwner | null => owner,
	claim(id: SpeechOwner): void {
		if (owner === id) return;
		owner = id;
		notify();
	},
	release(id: SpeechOwner): void {
		if (owner !== id) return;
		owner = null;
		notify();
	},
	is: (id: SpeechOwner): boolean => owner === id,
	subscribe(listener: (owner: SpeechOwner | null) => void): () => void {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
};
