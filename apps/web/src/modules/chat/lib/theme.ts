export type Theme = "light" | "dark";

const STORAGE_KEY = "ace-theme";
const CHAT_THEME_ROOT = "[data-chat-design-system]";

export function getStoredTheme(): Theme | null {
	if (typeof window === "undefined") {
		return null;
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark") {
		return stored;
	}
	return null;
}

export function getPreferredTheme(): Theme {
	const stored = getStoredTheme();
	if (stored) {
		return stored;
	}

	if (typeof window === "undefined") {
		return "light";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
	if (typeof document === "undefined") {
		return;
	}

	const root = document.querySelector<HTMLElement>(CHAT_THEME_ROOT);
	if (root) {
		root.dataset.theme = theme;
	}
}

export function setTheme(theme: Theme) {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
}
