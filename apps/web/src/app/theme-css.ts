import { type ColorTokens, colors, textStyles } from "@personal-os/tokens";

function kebab(name: string): string {
	return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function variables(tokens: ColorTokens): string {
	return Object.entries(tokens)
		.map(([name, value]) => `--${kebab(name)}:${value};`)
		.join("");
}

const sans = `"SF Pro Text","SF Pro Display",-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI",Roboto,sans-serif`;
const mono = `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;

/** Colour tokens as CSS variables. The landing page is designed in Dark only (Figma "Landing"). */
export const themeCss = [
	`:root{color-scheme:dark;${variables(colors.dark)}--font-sans:${sans};--font-mono:${mono};}`,
	`*,*::before,*::after{box-sizing:border-box}`,
	`html{scroll-behavior:smooth}`,
	`@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}`,
	`body{margin:0;background:var(--bg-canvas);color:var(--text-primary);font-family:var(--font-sans);font-size:${textStyles.body15.size}px;line-height:${textStyles.body15.lineHeight}px;-webkit-font-smoothing:antialiased}`,
].join("");
