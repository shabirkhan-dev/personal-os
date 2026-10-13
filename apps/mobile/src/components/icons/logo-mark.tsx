import { useId } from "react";
import Svg, { Circle, ClipPath, Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** Outline of the stem, bowl and striding leg, traced from the approved Figma mark. */
const BODY =
	"M85.7 171.1 L87.3 171.9 L89.4 173.4 L92.3 175.6 L95.9 178.6 L100.1 182.4 L104.8 186.2 L109.9 190.2 L115.5 194.4 L121.5 198.6 L127.5 202.7 L133.5 206.6 L139.5 210.2 L145.5 213.8 L151.8 217.2 L158.4 220.8 L165.4 224.2 L172.6 227.8 L179.6 231.0 L186.4 234.0 L192.9 236.8 L199.1 239.2 L206.2 241.9 L214.1 244.6 L222.7 247.5 L232.3 250.5 L245.7 254.2 L263.1 258.6 L284.4 263.6 L309.6 269.4 L330.9 274.4 L348.1 278.6 L361.4 282.1 L370.6 284.9 L379.7 287.9 L388.7 291.3 L397.6 295.0 L406.4 299.0 L414.9 303.4 L423.3 308.3 L431.5 313.6 L439.5 319.4 L446.6 324.8 L452.7 329.9 L457.9 334.8 L462.1 339.2 L466.2 343.9 L470.1 348.6 L473.7 353.5 L477.3 358.5 L480.4 363.4 L483.3 368.1 L485.9 372.8 L488.1 377.2 L490.1 381.5 L491.9 385.5 L493.4 389.2 L494.6 392.8 L495.9 397.3 L497.3 402.9 L498.7 409.6 L500.3 417.4 L501.4 424.9 L502.1 432.1 L502.5 439.1 L502.5 445.9 L502.2 452.8 L501.6 459.9 L500.6 467.2 L499.4 474.8 L497.7 482.2 L495.7 489.8 L493.4 497.2 L490.6 504.8 L487.9 511.4 L485.3 517.3 L482.7 522.4 L480.3 526.6 L482.7 534.1 L490.3 544.9 L502.7 558.9 L520.3 576.1 L535.3 590.7 L547.7 602.6 L557.7 611.8 L565.3 618.2 L572.4 624.2 L579.1 629.8 L585.5 634.8 L591.5 639.2 L596.1 642.8 L599.4 645.4 L601.3 647.1 L601.7 647.9 L602.0 648.6 L602.0 649.2 L601.7 649.8 L601.3 650.2 L596.4 650.6 L587.1 650.9 L573.5 651.0 L555.5 651.0 L540.4 650.8 L528.1 650.4 L518.7 649.9 L512.3 649.1 L505.7 648.2 L499.3 647.1 L492.7 645.8 L486.3 644.2 L479.8 642.6 L473.4 640.7 L467.1 638.6 L460.9 636.4 L453.9 633.4 L446.3 629.8 L438.0 625.5 L429.0 620.5 L419.8 614.8 L410.4 608.2 L400.9 601.0 L391.1 593.0 L377.6 580.8 L360.4 564.2 L339.4 543.5 L314.6 518.5 L294.8 498.1 L279.9 482.4 L270.0 471.2 L265.0 464.8 L260.5 458.7 L256.5 453.1 L253.0 447.9 L250.0 443.1 L245.9 435.9 L240.8 426.3 L234.6 414.2 L218.0 375.0 L216.1 377.0 L216.1 414.0 L216.1 444.0 L215.9 488.0 L215.4 521.9 L214.8 545.6 L214.0 559.2 L213.0 562.8 L212.0 565.9 L211.0 568.6 L210.0 571.0 L209.0 573.0 L207.6 575.3 L205.9 577.9 L203.7 580.9 L201.3 584.1 L198.7 587.1 L196.1 589.9 L193.4 592.4 L190.6 594.6 L187.7 596.8 L184.6 598.8 L181.3 600.6 L177.7 602.4 L174.1 603.9 L170.2 605.3 L166.1 606.5 L161.9 607.5 L157.7 608.2 L153.7 608.8 L149.9 609.0 L146.1 609.0 L142.3 608.8 L138.3 608.2 L134.1 607.5 L129.9 606.5 L125.8 605.3 L121.9 603.9 L118.3 602.4 L114.7 600.6 L111.4 598.8 L108.3 596.8 L105.4 594.6 L102.6 592.4 L100.0 590.0 L97.5 587.5 L95.1 584.9 L92.9 582.1 L90.8 579.3 L88.9 576.4 L87.3 573.5 L85.7 570.5 L84.4 567.3 L83.1 563.9 L82.0 560.4 L81.0 556.6 L80.1 530.7 L79.4 482.6 L78.7 412.2 L78.3 319.8 L78.0 249.9 L78.0 202.6 L78.3 178.0 L78.7 176.0 L79.4 174.3 L80.1 172.9 L81.0 171.9 L82.0 171.1 L83.1 170.8 L84.4 170.8 Z";

/** The lit top surface of the ribbon, clipped to the body. */
const RIBBON_TOP =
	"M82.5 174.0 C102.5 264.0 152.5 329.0 219.5 372.0 C304.5 422.0 404.5 469.0 481.5 530.0 L644.5 530.0 L644.5 124.0 L54.5 124.0 Z";

const VIEW_BOX = "0 0 680 680";

/**
 * "Logo / Roz mark": an R that is also a person striding forward. The dot is the head.
 * Brand artwork, so it keeps its own gradients instead of theme colours.
 */
export function LogoMark({ size = 72 }: { size?: number }) {
	const id = useId().replace(/[^a-zA-Z0-9]/g, "");

	return (
		<Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
			<Defs>
				<LinearGradient id={`body${id}`} x1="0" y1="0" x2="1" y2="1">
					<Stop offset="0" stopColor="#4F95F8" />
					<Stop offset="0.55" stopColor="#1F6FF0" />
					<Stop offset="1" stopColor="#0352D6" />
				</LinearGradient>
				<LinearGradient id={`top${id}`} x1="0" y1="0" x2="1" y2="1">
					<Stop offset="0" stopColor="#B4D4FD" />
					<Stop offset="0.35" stopColor="#6AA8FA" />
					<Stop offset="0.7" stopColor="#3384F6" />
					<Stop offset="1" stopColor="#1C6CEE" stopOpacity={0.6} />
				</LinearGradient>
				<LinearGradient id={`head${id}`} x1="0" y1="0" x2="1" y2="1">
					<Stop offset="0" stopColor="#78B1FB" />
					<Stop offset="0.5" stopColor="#3384F6" />
					<Stop offset="1" stopColor="#0657DC" />
				</LinearGradient>
				<ClipPath id={`clip${id}`}>
					<Path d={BODY} />
				</ClipPath>
			</Defs>
			<Path d={BODY} fill={`url(#body${id})`} />
			<Path d={RIBBON_TOP} fill={`url(#top${id})`} clipPath={`url(#clip${id})`} />
			<Circle cx="338.7" cy="127.9" r="99" fill={`url(#head${id})`} />
		</Svg>
	);
}
