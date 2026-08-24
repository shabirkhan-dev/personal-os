import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { ColorValue } from "react-native";
import { useResolveClassNames } from "uniwind";

export type IconProp = IconSvgElement;

export interface IconProps {
	icon?: IconSvgElement | null;
	size?: number;
	color?: string | ColorValue;
	strokeWidth?: number;
	className?: string;
	[key: string]: unknown;
}

export function Icon({
	icon,
	size = 20,
	color,
	strokeWidth = 1.5,
	className,
	...props
}: IconProps) {
	const resolvedStyles = useResolveClassNames(className ?? "text-foreground");
	const resolvedColor = color ?? resolvedStyles.color ?? "#000000";

	if (!icon) return null;
	return (
		<HugeiconsIcon
			icon={icon}
			size={size}
			color={resolvedColor}
			strokeWidth={strokeWidth}
			{...props}
		/>
	);
}
