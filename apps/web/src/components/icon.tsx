import { type IconName, type IconPath, iconPaths } from "./icon-paths";

export type { IconName };

type IconProps = {
	name: IconName;
	size?: number;
	/** Any CSS colour; tokens via `var(--…)`. */
	color: string;
};

/** Kit v2 glyph, decorative: the surrounding text carries the meaning. */
export function Icon({ name, size = 20, color }: IconProps) {
	const paths: readonly IconPath[] = iconPaths[name];
	return (
		<svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
			{paths.map((path) => (
				<path
					key={path.d}
					d={path.d}
					fill={color}
					fillRule={path.evenOdd ? "evenodd" : undefined}
					clipRule={path.evenOdd ? "evenodd" : undefined}
				/>
			))}
		</svg>
	);
}
