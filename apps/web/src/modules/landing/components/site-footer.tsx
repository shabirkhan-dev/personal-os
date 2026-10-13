import { LogoMark } from "@/components/logo-mark";
import styles from "../landing.module.css";

export function SiteFooter() {
	return (
		<footer className={styles.footer}>
			<div className={styles.footerBrand}>
				<LogoMark size={24} />
				<span className={styles.brandName}>Personal OS</span>
				<span className={styles.footerMeta}>© 2026 Rabtx</span>
			</div>
			<nav aria-label="Footer" className={styles.footerLinks}>
				<a href="#modules">Modules</a>
				<a href="#how">How it works</a>
				<a href="#why">Privacy</a>
				<a href="#notify">Get notified</a>
			</nav>
		</footer>
	);
}
