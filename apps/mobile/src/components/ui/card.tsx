import type * as React from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
	className?: string;
	children?: React.ReactNode;
}

export function Card({ className, ...props }: CardProps) {
	return (
		<View
			className={cn(
				"bg-card border border-border rounded-3xl p-5 shadow-sm shadow-black/5",
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: ViewProps) {
	return <View className={cn("flex-col gap-1.5 mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
	return (
		<Text
			className={cn("text-card-foreground font-semibold text-base tracking-tight", className)}
			{...props}
		/>
	);
}

export function CardDescription({ className, ...props }: TextProps) {
	return (
		<Text className={cn("text-muted-foreground text-xs leading-relaxed", className)} {...props} />
	);
}

export function CardContent({ className, ...props }: ViewProps) {
	return <View className={cn("flex-col", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
	return (
		<View
			className={cn("flex-row items-center pt-4 mt-4 border-t border-border/40", className)}
			{...props}
		/>
	);
}
