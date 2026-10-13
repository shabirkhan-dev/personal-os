import Image from "next/image";
import styles from "./phone.module.css";

type PhoneProps = {
	/** Screen image in `public/screens`, exported from Figma at 780×1688. */
	src: string;
	alt: string;
	/** Rendered width in CSS pixels; the height follows the 390×844 screen. */
	width: number;
	className?: string;
	priority?: boolean;
};

/** A phone frame around an app screen, as in the Figma "Landing" showcase. */
export function Phone({ src, alt, width, className, priority = false }: PhoneProps) {
	return (
		<div
			className={className ? `${styles.phone} ${className}` : styles.phone}
			style={{ width, borderRadius: Math.round(width * 0.1333) }}
		>
			<Image
				src={src}
				alt={alt}
				width={780}
				height={1688}
				sizes={`${width}px`}
				priority={priority}
				className={styles.screen}
			/>
		</div>
	);
}
