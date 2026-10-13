import Svg, { Path } from "react-native-svg";
import { type IconName, iconPaths } from "./icon-paths";

export type IconProps = {
	name: IconName;
	/** Rendered size in px. Kit v2 glyphs are drawn on a 20px grid. */
	size?: number;
	color: string;
	opacity?: number;
};

/** Renders a Kit v2 glyph. Colour always comes from a theme token. */
export function Icon({ name, size = 20, color, opacity }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 20 20" fill="none" opacity={opacity}>
			{iconPaths[name].map((path) => (
				<Path
					key={path.d.slice(0, 24)}
					d={path.d}
					fill={color}
					fillRule={"evenOdd" in path && path.evenOdd ? "evenodd" : "nonzero"}
					clipRule={"evenOdd" in path && path.evenOdd ? "evenodd" : "nonzero"}
				/>
			))}
		</Svg>
	);
}
