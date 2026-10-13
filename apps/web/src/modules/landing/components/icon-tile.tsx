import { Icon, type IconName } from "@/components/icon";
import styles from "../landing.module.css";

type IconTileProps = { icon: IconName; tone: { icon: string; tile: string }; size: 48 | 52 };

/** Round tinted tile with a Kit v2 glyph, as on the module cards in the app. */
export function IconTile({ icon, tone, size }: IconTileProps) {
	return (
		<span className={styles.tile} style={{ width: size, height: size, background: tone.tile }}>
			<Icon name={icon} size={size === 52 ? 24 : 22} color={tone.icon} />
		</span>
	);
}
