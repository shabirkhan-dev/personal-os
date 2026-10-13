import { Phone } from "@/components/phone";
import styles from "../landing.module.css";

export function Hero() {
	return (
		<section className={styles.hero} aria-labelledby="hero-title">
			<div className={styles.heroGlow} aria-hidden="true" />
			<p className={styles.badge}>
				<span className={styles.badgeDot} aria-hidden="true" />
				Coming soon · Android &amp; iOS
			</p>
			<h1 id="hero-title" className={styles.heroTitle}>
				Your whole life,
				<br />
				in one calm place.
			</h1>
			<p className={styles.heroSub}>
				Plans, money, workouts, skincare, food and outfits — one app that builds your day around
				you, and answers when you just ask.
			</p>
			<div className={styles.ctas}>
				<a href="#notify" className={`${styles.pill} ${styles.pillLight}`}>
					Android · coming soon
				</a>
				<a href="#notify" className={`${styles.pill} ${styles.pillDark}`}>
					iOS · coming soon
				</a>
			</div>
			<p className={styles.footnote}>Free · launching on Android and iOS</p>
			<div className={styles.showcase}>
				<Phone
					src="/screens/modules-picker.webp"
					alt="The module picker: Overview, Daily life, Finance, Workout, Skincare, Food and Fashion."
					width={242}
					className={styles.sidePhone}
				/>
				<Phone
					src="/screens/home.webp"
					alt="Home: money left to spend this month, the ask bar and what's next today."
					width={289}
					priority
				/>
				<Phone
					src="/screens/plan.webp"
					alt="Your first day: a plan from wake-up to sleep built from your answers."
					width={242}
					className={styles.sidePhone}
				/>
			</div>
		</section>
	);
}
