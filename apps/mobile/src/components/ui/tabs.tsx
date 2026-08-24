import { Pressable, type PressableProps, Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function TabsList({ className, ...props }: ViewProps) {
	return (
		<View
			className={cn("flex-row p-1 bg-muted/60 border border-border/40 rounded-2xl mb-4", className)}
			{...props}
		/>
	);
}

export interface TabsTriggerProps extends PressableProps {
	active?: boolean;
	label: string;
	className?: string;
}

export function TabsTrigger({ active = false, label, className, ...props }: TabsTriggerProps) {
	return (
		<Pressable
			className={cn(
				"flex-1 py-2.5 rounded-xl items-center justify-center",
				active && "bg-card border border-border/60 shadow-sm shadow-black/10",
				className,
			)}
			{...props}
		>
			<Text
				className={cn(
					"text-xs tracking-tight",
					active ? "text-card-foreground font-bold" : "text-muted-foreground font-medium",
				)}
			>
				{label}
			</Text>
		</Pressable>
	);
}
