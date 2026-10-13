import styles from "../landing.module.css";

type SectionHeadingProps = {
	id: string;
	eyebrow: string;
	title: string;
	sub?: string;
	align?: "center" | "start";
};

/** Mono eyebrow, large title and an optional line of supporting copy. */
export function SectionHeading({ id, eyebrow, title, sub, align = "center" }: SectionHeadingProps) {
	return (
		<div
			className={align === "center" ? styles.heading : `${styles.heading} ${styles.headingStart}`}
		>
			<p className={styles.eyebrow}>{eyebrow}</p>
			<h2 id={id} className={styles.title}>
				{title}
			</h2>
			{sub ? <p className={styles.sub}>{sub}</p> : null}
		</div>
	);
}
