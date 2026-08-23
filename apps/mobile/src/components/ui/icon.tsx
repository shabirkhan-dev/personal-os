import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";

export type IconProp = IconSvgElement;

export interface IconProps {
	icon: IconSvgElement;
	size?: number;
	color?: string;
	strokeWidth?: number;
}

export function Icon({ icon, size = 20, color = "#FFFFFF", strokeWidth = 1.5 }: IconProps) {
	return <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />;
}
