import { type ColorTokens, colors, textStyles } from "@personal-os/tokens";

function kebab(name: string): string {
	return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function variables(tokens: ColorTokens): string {
	return Object.entries(tokens)
		.map(([name, value]) => `--${kebab(name)}:${value};`)
		.join("");
}

/** Colour tokens as CSS variables: Dark by default, Light when the system asks. */
export const themeCss = [
	`:root{color-scheme:dark;${variables(colors.dark)}}`,
	`@media (prefers-color-scheme: light){:root{color-scheme:light;${variables(colors.light)}}}`,
	`body{margin:0;background:var(--bg-app);color:var(--text-primary);font-family:"SF Pro Text",-apple-system,system-ui,"Segoe UI",Roboto,sans-serif;font-size:${textStyles.body15.size}px;line-height:${textStyles.body15.lineHeight}px}`,
].join("");
