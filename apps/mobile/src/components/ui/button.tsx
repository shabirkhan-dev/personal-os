import type * as React from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	Text,
	type TextProps,
} from "react-native";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends PressableProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
	default: "bg-primary active:opacity-90",
	secondary: "bg-secondary active:opacity-80",
	destructive: "bg-destructive active:opacity-90",
	outline: "bg-transparent border border-border active:bg-muted/40",
	ghost: "bg-transparent active:bg-muted/30",
	link: "bg-transparent underline",
};

const sizeStyles: Record<ButtonSize, string> = {
	default: "h-12 px-5 rounded-2xl",
	sm: "h-9 px-3.5 rounded-xl",
	lg: "h-14 px-7 rounded-2xl",
	icon: "h-10 w-10 rounded-xl items-center justify-center p-0",
};

const textVariantStyles: Record<ButtonVariant, string> = {
	default: "text-primary-foreground font-bold",
	secondary: "text-secondary-foreground font-semibold",
	destructive: "text-destructive-foreground font-bold",
	outline: "text-foreground font-semibold",
	ghost: "text-foreground font-medium",
	link: "text-primary font-medium underline",
};

const textSizeStyles: Record<ButtonSize, string> = {
	default: "text-sm",
	sm: "text-xs",
	lg: "text-base",
	icon: "text-sm",
};

export function Button({
	variant = "default",
	size = "default",
	loading = false,
	disabled = false,
	className,
	children,
	...props
}: ButtonProps) {
	const isDisabled = disabled || loading;

	return (
		<Pressable
			disabled={isDisabled}
			className={cn(
				"flex-row items-center justify-center gap-2",
				variantStyles[variant],
				sizeStyles[size],
				isDisabled && "opacity-50",
				className,
			)}
			{...props}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={
						variant === "default" ? "#000000" : variant === "destructive" ? "#FFFFFF" : "#888888"
					}
				/>
			) : typeof children === "string" ? (
				<Text className={cn(textVariantStyles[variant], textSizeStyles[size])}>{children}</Text>
			) : (
				children
			)}
		</Pressable>
	);
}

export function ButtonText({
	variant = "default",
	size = "default",
	className,
	...props
}: TextProps & { variant?: ButtonVariant; size?: ButtonSize }) {
	return (
		<Text className={cn(textVariantStyles[variant], textSizeStyles[size], className)} {...props} />
	);
}
