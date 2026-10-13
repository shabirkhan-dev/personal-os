import { cn } from "@starter/ui/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type TypesetPreset = "docs" | "chat" | "compact" | "reading" | "large";

export interface TypesetProps extends ComponentPropsWithoutRef<"div"> {
	preset?: TypesetPreset;
	size?: string;
	leading?: string | number;
	flow?: string;
	fontBody?: string;
	fontHeading?: string;
	fontMono?: string;
	children?: ReactNode;
}

export function Typeset({
	preset,
	size,
	leading,
	flow,
	fontBody,
	fontHeading,
	fontMono,
	className,
	style,
	children,
	...props
}: TypesetProps) {
	const customVars: Record<string, string | number | undefined> = {};
	if (size) customVars["--typeset-size"] = size;
	if (leading) customVars["--typeset-leading"] = leading;
	if (flow) customVars["--typeset-flow"] = flow;
	if (fontBody) customVars["--typeset-font-body"] = fontBody;
	if (fontHeading) customVars["--typeset-font-heading"] = fontHeading;
	if (fontMono) customVars["--typeset-font-mono"] = fontMono;

	return (
		<div
			className={cn("typeset", preset && `typeset-${preset}`, className)}
			style={{ ...customVars, ...style } as React.CSSProperties}
			{...props}
		>
			{children}
		</div>
	);
}

export function TypesetScroll({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
	return (
		<div className={cn("typeset-scroll", className)} {...props}>
			{children}
		</div>
	);
}

export function NotTypeset({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
	return (
		<div className={cn("not-typeset", className)} data-not-typeset {...props}>
			{children}
		</div>
	);
}
