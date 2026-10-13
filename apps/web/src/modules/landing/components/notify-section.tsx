import { LogoMark } from "@/components/logo-mark";
import styles from "../landing.module.css";
import { NotifyForm } from "./notify-form";

export function NotifySection() {
	return (
		<section id="notify" className={styles.section} aria-labelledby="notify-title">
			<div className={styles.notifyCard}>
				<div className={styles.notifyGlow} aria-hidden="true" />
				<LogoMark size={56} />
				<h2 id="notify-title" className={styles.title}>
					Start with today.
				</h2>
				<p className={styles.sub}>
					Coming soon to Android and iPhone. Leave your email and we’ll tell you the day it lands.
				</p>
				<NotifyForm />
				<p className={styles.footnote}>No spam · one email on launch day</p>
			</div>
		</section>
	);
}
