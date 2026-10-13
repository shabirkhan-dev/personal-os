import Image from "next/image";

/** "Logo / Roz mark": the R-person, served as a static SVG from `public/`. */
export function LogoMark({ size }: { size: number }) {
	return <Image src="/roz-mark.svg" alt="" width={size} height={size} />;
}
