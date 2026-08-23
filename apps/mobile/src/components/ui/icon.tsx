import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { ColorValue } from "react-native";

export type IconProp = IconSvgElement;

export interface IconProps {
	icon?: IconSvgElement | null;
	size?: number;
	color?: string | ColorValue;
	strokeWidth?: number;
	[key: string]: unknown;
}

export function Icon({
	icon,
	size = 20,
	color = "#FFFFFF",
	strokeWidth = 1.5,
	...props
}: IconProps) {
	if (!icon) return null;
	return (
		<HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} {...props} />
	);
}
