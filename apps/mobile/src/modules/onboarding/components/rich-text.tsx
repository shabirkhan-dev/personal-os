import type { TextStyleName } from "@personal-os/tokens";
import { PoText, type PoTextProps } from "@/components/ui/po-text";

/** Plain strings render in the base tone; `[string]` tuples are emphasised in text/primary. */
export type RichPart = string | readonly [string];

export type RichTextProps = Omit<PoTextProps, "children"> & {
	parts: readonly RichPart[];
	variant?: TextStyleName;
};

/** Body copy where a few phrases are lifted to text/primary, as in the Figma frames. */
export function RichText({
	parts,
	tone = "textSecondary",
	variant = "body15",
	...rest
}: RichTextProps) {
	return (
		<PoText variant={variant} tone={tone} {...rest}>
			{parts.map((part, index) =>
				typeof part === "string" ? (
					part
				) : (
					// Parts are static copy, so the index is a stable key.
					// oxlint-disable-next-line react/no-array-index-key
					<PoText key={index} variant={variant} tone="textPrimary">
						{part[0]}
					</PoText>
				),
			)}
		</PoText>
	);
}
