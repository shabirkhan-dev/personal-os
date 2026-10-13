import { features } from "../content";
import styles from "../landing.module.css";
import { IconTile } from "./icon-tile";
import { SectionHeading } from "./section-heading";

export function WhySection() {
	return (
		<section id="why" className={styles.section} aria-labelledby="why-title">
			<SectionHeading
				id="why-title"
				eyebrow="Why Personal OS"
				title="Less juggling. More living."
				sub="Six apps, three spreadsheets and a notes file — replaced by one place that knows what matters today."
			/>
			<ul className={styles.featureGrid}>
				{features.map((feature) => (
					<li key={feature.title} className={styles.card}>
						<IconTile icon={feature.icon} tone={feature.tone} size={48} />
						<div className={styles.cardText}>
							<h3 className={styles.cardTitle}>{feature.title}</h3>
							<p className={styles.cardBody}>{feature.body}</p>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
