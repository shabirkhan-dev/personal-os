import { LogoMark } from "@/components/logo-mark";
import styles from "../landing.module.css";

export function SiteNav() {
	return (
		<header className={styles.nav}>
			<a href="#top" className={styles.brand} aria-label="Personal OS, back to top">
				<LogoMark size={36} />
				<span className={styles.brandName}>Personal OS</span>
			</a>
			<nav aria-label="Sections" className={styles.navLinks}>
				<a href="#modules" className={styles.navLink}>
					Modules
				</a>
				<a href="#how" className={styles.navLink}>
					How it works
				</a>
				<a href="#why" className={styles.navLink}>
					Privacy
				</a>
				<a href="#notify" className={`${styles.pill} ${styles.pillLight} ${styles.navCta}`}>
					Get notified
				</a>
			</nav>
		</header>
	);
}
