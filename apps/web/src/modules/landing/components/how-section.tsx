import { Phone } from "@/components/phone";
import { steps } from "../content";
import styles from "../landing.module.css";
import { SectionHeading } from "./section-heading";

export function HowSection() {
	return (
		<section id="how" className={`${styles.section} ${styles.how}`} aria-labelledby="how-title">
			<div className={styles.howSteps}>
				<SectionHeading
					id="how-title"
					eyebrow="How it works"
					title="A plan in two minutes."
					align="start"
				/>
				<ol className={styles.steps}>
					{steps.map((step, index) => (
						<li key={step.title} className={styles.step}>
							<span className={styles.stepNumber} aria-hidden="true">
								{String(index + 1).padStart(2, "0")}
							</span>
							<div className={styles.cardText}>
								<h3 className={styles.cardTitle}>{step.title}</h3>
								<p className={styles.cardBody}>{step.body}</p>
							</div>
						</li>
					))}
				</ol>
			</div>
			<div className={styles.howPhones}>
				<Phone
					src="/screens/setup-modules.webp"
					alt="Setup: modules matched to your goals, ready to turn on or off."
					width={234}
				/>
				<Phone
					src="/screens/plan.webp"
					alt="Your first day, built from your answers."
					width={234}
					className={styles.sidePhone}
				/>
			</div>
		</section>
	);
}
