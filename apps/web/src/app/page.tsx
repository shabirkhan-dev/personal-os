import { Hero } from "@/modules/landing/components/hero";
import { HowSection } from "@/modules/landing/components/how-section";
import { ModulesSection } from "@/modules/landing/components/modules-section";
import { NotifySection } from "@/modules/landing/components/notify-section";
import { SiteFooter } from "@/modules/landing/components/site-footer";
import { SiteNav } from "@/modules/landing/components/site-nav";
import { WhySection } from "@/modules/landing/components/why-section";
import styles from "@/modules/landing/landing.module.css";

/** Landing page (Figma page "Landing"). Static; deployed to Cloudflare Pages. */
export default function Home() {
	return (
		<div id="top" className={styles.page}>
			<SiteNav />
			<main>
				<Hero />
				<WhySection />
				<ModulesSection />
				<HowSection />
				<NotifySection />
			</main>
			<SiteFooter />
		</div>
	);
}
