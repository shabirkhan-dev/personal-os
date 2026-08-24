import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends ViewProps {
	orientation?: "horizontal" | "vertical";
	className?: string;
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
	return (
		<View
			className={cn(
				"bg-border/60",
				orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
				className,
			)}
			{...props}
		/>
	);
}
