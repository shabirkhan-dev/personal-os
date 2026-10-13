import Svg, { Path } from "react-native-svg";
import { usePoTheme } from "@/theme";

/** "Logo / Personal OS mark": four tiles = life areas in one place. */
export function LogoMark({ size = 72 }: { size?: number }) {
	const { colors } = usePoTheme();
	const tile = colors.textOnAccent;

	return (
		<Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
			<Path
				d="M0 20C0 8.95431 8.95431 0 20 0H52C63.0457 0 72 8.95431 72 20V52C72 63.0457 63.0457 72 52 72H20C8.95431 72 0 63.0457 0 52V20Z"
				fill={colors.accentDefault}
			/>
			<Path
				d="M30 21H25C22.7909 21 21 22.7909 21 25V30C21 32.2091 22.7909 34 25 34H30C32.2091 34 34 32.2091 34 30V25C34 22.7909 32.2091 21 30 21Z"
				fill={tile}
			/>
			<Path
				opacity={0.55}
				d="M51 27.5C51 23.9101 48.0899 21 44.5 21C40.9101 21 38 23.9101 38 27.5C38 31.0899 40.9101 34 44.5 34C48.0899 34 51 31.0899 51 27.5Z"
				fill={tile}
			/>
			<Path
				d="M30 38H25C22.7909 38 21 39.7909 21 42V47C21 49.2091 22.7909 51 25 51H30C32.2091 51 34 49.2091 34 47V42C34 39.7909 32.2091 38 30 38Z"
				fill={tile}
			/>
			<Path
				d="M47 38H42C39.7909 38 38 39.7909 38 42V47C38 49.2091 39.7909 51 42 51H47C49.2091 51 51 49.2091 51 47V42C51 39.7909 49.2091 38 47 38Z"
				fill={tile}
			/>
		</Svg>
	);
}
