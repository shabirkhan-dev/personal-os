import type * as React from "react";
import { View, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";

interface NeonCardProps {
	children: React.ReactNode;
	style?: ViewStyle;
	className?: string;
	glowPosition?: "top-right" | "bottom-left" | "both-diagonal" | "none";
}

export function NeonCard({ children, style, className }: NeonCardProps) {
	return (
		<View className={cn("rounded-3xl border border-border bg-card p-6", className)} style={style}>
			{children}
		</View>
	);
}
