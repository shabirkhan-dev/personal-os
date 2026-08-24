import type * as React from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export type BadgeVariant =
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "success"
	| "warning";

export interface BadgeProps extends ViewProps {
	variant?: BadgeVariant;
	className?: string;
	children?: React.ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
	default: "bg-primary/20 border-primary/30",
	secondary: "bg-secondary border-border/40",
	destructive: "bg-destructive/15 border-destructive/30",
	outline: "bg-transparent border-border",
	success: "bg-emerald-500/15 border-emerald-500/30",
	warning: "bg-amber-500/15 border-amber-500/30",
};

const badgeTextVariants: Record<BadgeVariant, string> = {
	default: "text-primary font-bold",
	secondary: "text-secondary-foreground font-semibold",
	destructive: "text-destructive font-bold",
	outline: "text-muted-foreground font-medium",
	success: "text-emerald-500 font-bold",
	warning: "text-amber-500 font-bold",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
	return (
		<View
			className={cn(
				"flex-row items-center gap-1 px-2.5 py-1 rounded-full border",
				badgeVariants[variant],
				className,
			)}
			{...props}
		>
			{typeof children === "string" ? (
				<Text className={cn("text-[11px]", badgeTextVariants[variant])}>{children}</Text>
			) : (
				children
			)}
		</View>
	);
}

export function BadgeText({
	variant = "default",
	className,
	...props
}: TextProps & { variant?: BadgeVariant }) {
	return <Text className={cn("text-[11px]", badgeTextVariants[variant], className)} {...props} />;
}
