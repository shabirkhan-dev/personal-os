/** Small Web Crypto helpers; they run the same on Workers and in Node tests. */

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
	const data = crypto.getRandomValues(new Uint8Array(bytes));
	let binary = "";
	for (const byte of data) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** A uniform six-digit code (no modulo bias). */
export function randomCode(): string {
	const limit = 4_294_000_000; // largest multiple of 900_000 below 2^32
	const value = new Uint32Array(1);
	do crypto.getRandomValues(value);
	while ((value[0] ?? limit) >= limit);
	return String(100_000 + ((value[0] ?? 0) % 900_000));
}

export async function sha256(value: string): Promise<string> {
	return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function hmacSha256(secret: string, value: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

/** Compares two hex digests without leaking where they differ. */
export function safeEqual(actual: string, expected: string): boolean {
	if (actual.length !== expected.length) return false;
	let difference = 0;
	for (let index = 0; index < actual.length; index += 1) {
		difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
	}
	return difference === 0;
}
