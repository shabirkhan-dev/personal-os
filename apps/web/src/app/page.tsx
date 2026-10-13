import { radius, textStyles } from "@personal-os/tokens";
import type { CSSProperties } from "react";

const title = textStyles.title30;
const body = textStyles.body15;

const styles = {
	main: {
		minHeight: "100vh",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: 16,
		padding: 24,
		textAlign: "center",
	},
	mark: {
		width: 72,
		height: 72,
		borderRadius: radius["2xl"],
		background: "var(--accent-default)",
	},
	title: {
		margin: 0,
		fontSize: title.size,
		lineHeight: `${title.lineHeight}px`,
		letterSpacing: title.letterSpacing,
		fontWeight: 500,
	},
	body: {
		margin: 0,
		fontSize: body.size,
		lineHeight: `${body.lineHeight}px`,
		color: "var(--text-secondary)",
	},
} satisfies Record<string, CSSProperties>;

/** Landing page placeholder; Personal OS ships as a mobile app. */
export default function Home() {
	return (
		<main style={styles.main}>
			<div aria-hidden style={styles.mark} />
			<h1 style={styles.title}>Personal OS</h1>
			<p style={styles.body}>Your life, in one place. Coming soon to iOS and Android.</p>
		</main>
	);
}
