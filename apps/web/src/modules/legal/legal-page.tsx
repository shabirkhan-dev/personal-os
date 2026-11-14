import { LEGAL_CONTACT, type LegalDocument } from "@personal-os/domain/legal";
import Link from "next/link";
import styles from "./legal.module.css";

/** The privacy policy or terms, the same text the app shows in Settings. */
export function LegalPage({ document }: { document: LegalDocument }) {
	return (
		<main className={styles.page}>
			<Link className={styles.back} href="/">
				← Personal OS
			</Link>
			<p className={styles.eyebrow}>Updated {document.updated}</p>
			<h1 className={styles.title}>{document.title}</h1>
			<p className={styles.intro}>{document.intro}</p>
			{document.sections.map((section) => (
				<section key={section.heading} className={styles.section}>
					<h2>{section.heading}</h2>
					{section.paragraphs.map((paragraph) => (
						<p key={paragraph.slice(0, 40)}>{paragraph}</p>
					))}
				</section>
			))}
			<p className={styles.intro}>
				Contact:{" "}
				<a className={styles.contact} href={LEGAL_CONTACT}>
					the project&apos;s GitHub page
				</a>
			</p>
		</main>
	);
}
