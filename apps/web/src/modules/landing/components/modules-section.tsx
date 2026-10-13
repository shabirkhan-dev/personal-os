import { modules } from "../content";
import styles from "../landing.module.css";
import { IconTile } from "./icon-tile";
import { SectionHeading } from "./section-heading";

export function ModulesSection() {
	return (
		<section id="modules" className={styles.section} aria-labelledby="modules-title">
			<SectionHeading
				id="modules-title"
				eyebrow="Modules"
				title="Pick the parts of life you want help with."
				sub="Start with one. Add more whenever you like — everything shows up on the same Today."
			/>
			<ul className={styles.moduleGrid}>
				{modules.map((module) => (
					<li key={module.name} className={styles.card}>
						<div className={styles.moduleTop}>
							<IconTile icon={module.icon} tone={module.tone} size={52} />
							<div>
								<h3 className={styles.moduleName}>{module.name}</h3>
								<p className={styles.moduleMeta}>{module.meta}</p>
							</div>
						</div>
						<p className={styles.cardBody}>{module.body}</p>
					</li>
				))}
			</ul>
		</section>
	);
}
