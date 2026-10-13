import { type ColorMode, type ColorTokens, colors, defaultColorMode } from "@personal-os/tokens";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "system" | ColorMode;

type ThemeContextValue = {
	mode: ColorMode;
	colors: ColorTokens;
	preference: ThemePreference;
	setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

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
	const [preference, setPreference] = useState<ThemePreference>("system");
	const mode = resolveColorMode(preference, system);

	const value = useMemo(
		() => ({ mode, colors: colors[mode], preference, setPreference }),
		[mode, preference],
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
