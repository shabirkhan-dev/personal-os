import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from "expo-router/react-navigation";
import type * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";
import { Uniwind } from "uniwind";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeColors {
	background: string;
	surface: string;
	card: {
		gradient: readonly [string, string];
		border: string;
	};
	text: {
		primary: string;
		secondary: string;
		muted: string;
	};
	accent: {
		green: string;
		orange: string;
		blue: string;
		red: string;
		purple: string;
		yellow: string;
		cyan: string;
		pink: string;
		teal: string;
	};
}

export const DarkThemeColors: ThemeColors = {
	background: "#0B0C10",
	surface: "#15161A",
	card: {
		gradient: ["#222222", "#141414"] as const,
		border: "rgba(255, 255, 255, 0.08)",
	},
	text: {
		primary: "#FFFFFF",
		secondary: "#888888",
		muted: "#444444",
	},
	accent: {
		green: "#00E676",
		orange: "#FF6D00",
		blue: "#00B0FF",
		red: "#FF1744",
		purple: "#D500F9",
		yellow: "#FFEA00",
		cyan: "#18FFFF",
		pink: "#FF007F",
		teal: "#00BFA5",
	},
};

export const LightThemeColors: ThemeColors = {
	background: "#F8FAFC",
	surface: "#FFFFFF",
	card: {
		gradient: ["#FFFFFF", "#F1F5F9"] as const,
		border: "#E2E8F0",
	},
	text: {
		primary: "#0F172A",
		secondary: "#64748B",
		muted: "#94A3B8",
	},
	accent: {
		green: "#00C853",
		orange: "#FF6D00",
		blue: "#0288D1",
		red: "#D50000",
		purple: "#AA00FF",
		yellow: "#FFD600",
		cyan: "#00B8D4",
		pink: "#C51162",
		teal: "#00897B",
	},
};

interface ThemeContextValue {
	theme: ThemeMode;
	activeTheme: "dark" | "light";
	isDark: boolean;
	colors: ThemeColors;
	setTheme: (mode: ThemeMode) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "dark",
	activeTheme: "dark",
	isDark: true,
	colors: DarkThemeColors,
	setTheme: () => undefined,
	toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const systemColorScheme = useRNColorScheme();
	const [theme, setThemeState] = useState<ThemeMode>("dark");

	const activeTheme: "dark" | "light" =
		theme === "system" ? (systemColorScheme === "light" ? "light" : "dark") : theme;

	const isDark = activeTheme === "dark";
	const colors = isDark ? DarkThemeColors : LightThemeColors;

	useEffect(() => {
		Uniwind.setTheme(activeTheme);
		if (theme === "dark" || theme === "light") {
			Appearance.setColorScheme?.(theme);
		}
	}, [theme, activeTheme]);

	const setTheme = (mode: ThemeMode) => {
		setThemeState(mode);
	};

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				activeTheme,
				isDark,
				colors,
				setTheme,
				toggleTheme,
			}}
		>
			<NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
				{children}
			</NavigationThemeProvider>
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
