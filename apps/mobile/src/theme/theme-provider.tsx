import { type ColorMode, type ColorTokens, colors, defaultColorMode } from "@personal-os/tokens";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useColorScheme } from "react-native";
import { readJson, writeJson } from "@/lib/storage/json-file";

export type ThemePreference = "system" | ColorMode;

type ThemeContextValue = {
	mode: ColorMode;
	colors: ColorTokens;
	preference: ThemePreference;
	setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Saved as theme.json in the app's documents (chosen on Profile). */
const THEME_DOCUMENT = "theme";

export function parseThemePreference(raw: unknown): ThemePreference {
	const value =
		typeof raw === "object" && raw !== null ? (raw as { preference?: unknown }).preference : raw;
	return value === "light" || value === "dark" ? value : "system";
}

/** Resolves the system scheme, falling back to Dark (the Personal OS default). */
export function resolveColorMode(
	preference: ThemePreference,
	system: string | null | undefined,
): ColorMode {
	if (preference !== "system") return preference;
	if (system === "light" || system === "dark") return system;
	return defaultColorMode;
}

export function PoThemeProvider({ children }: { children: ReactNode }) {
	const system = useColorScheme();
	const [preference, setPreferenceState] = useState<ThemePreference>("system");
	/** True once the person picks a theme, so a slow read never overrides their choice. */
	const chosen = useRef(false);

	useEffect(() => {
		readJson(THEME_DOCUMENT)
			.then((raw) => {
				if (!chosen.current) setPreferenceState(parseThemePreference(raw));
			})
			.catch((error: unknown) => console.error("Could not read the theme preference", error));
	}, []);

	const setPreference = useCallback((next: ThemePreference) => {
		chosen.current = true;
		setPreferenceState(next);
		writeJson(THEME_DOCUMENT, { preference: next }).catch((error: unknown) =>
			console.error("Could not save the theme preference", error),
		);
	}, []);

	const mode = resolveColorMode(preference, system);

	const value = useMemo(
		() => ({ mode, colors: colors[mode], preference, setPreference }),
		[mode, preference, setPreference],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePoTheme(): ThemeContextValue {
	const value = useContext(ThemeContext);
	if (!value) {
		throw new Error("usePoTheme must be used inside <PoThemeProvider>.");
	}
	return value;
}
