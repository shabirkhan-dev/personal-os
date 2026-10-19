/** Rupee amounts as the Figma frames show them: "Rs 18,500" + ".00". */
export type MoneyParts = { whole: string; decimal: string };

export const CURRENCY = { code: "PKR", symbol: "Rs" } as const;

export function moneyParts(amount: number, symbol: string = CURRENCY.symbol): MoneyParts {
	const negative = amount < 0;
	const cents = Math.round(Math.abs(amount) * 100);
	const whole = Math.floor(cents / 100).toLocaleString("en-US");
	const decimal = String(cents % 100).padStart(2, "0");
	return { whole: `${negative ? "−" : ""}${symbol} ${whole}`, decimal: `.${decimal}` };
}

export function formatMoney(amount: number, symbol: string = CURRENCY.symbol): string {
	const { whole, decimal } = moneyParts(amount, symbol);
	return decimal === ".00" ? whole : `${whole}${decimal}`;
}

/** Above this a typed amount is a slip of the thumb, not money (a trillion rupees). */
export const MAX_AMOUNT = 1e12;

/**
 * Reads "1,240", "1240.50" or "Rs 300" typed by a person; null when it is not an amount or is
 * absurdly large. Zero is rejected unless `allowZero` is set (e.g. a balance that really is Rs 0).
 */
export function parseAmount(text: string, options: { allowZero?: boolean } = {}): number | null {
	const cleaned = text.replace(/rs\.?|pkr|,|\s/gi, "");
	if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
	const value = Number(cleaned);
	if (value > MAX_AMOUNT) return null;
	return value > 0 || (options.allowZero === true && value === 0) ? value : null;
}
