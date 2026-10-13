/**
 * Transport: where formatted lines go (console or custom).
 */

export type Transport = (line: string, level: string) => void;

export const consoleTransport: Transport = (line, level) => {
	if (level === "ERROR") {
		console.error(line);
	} else {
		console.log(line);
	}
};

export function createTransport(fn: (line: string, level: string) => void): Transport {
	return fn;
}
