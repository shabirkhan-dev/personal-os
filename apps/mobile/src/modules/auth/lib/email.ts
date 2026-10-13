const MAX_EMAIL_LENGTH = 320;
/** local@label(.label)+ with no overlapping parts, so matching stays linear on any input. */
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** A light shape check before asking the API to send a code; the API validates for real. */
export function isEmail(value: string): boolean {
	return value.length <= MAX_EMAIL_LENGTH && EMAIL.test(value);
}
