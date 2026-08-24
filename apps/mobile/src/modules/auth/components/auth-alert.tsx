import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

export interface AuthAlertProps {
	title?: string;
	message: string;
	variant?: "destructive" | "info" | "success";
	className?: string;
}

export function AuthAlert({ title, message, variant = "info", className }: AuthAlertProps) {
	const isDestructive = variant === "destructive";
	const isSuccess = variant === "success" || variant === "info";

	return (
		<View
			className={cn(
				"p-4 rounded-2xl border mb-3 flex-col gap-1",
				isDestructive && "bg-destructive/10 border-destructive/30",
				isSuccess && "bg-emerald-500/10 border-emerald-500/30",
				className,
			)}
		>
			{title ? (
				<Text
					className={cn(
						"text-xs font-bold uppercase tracking-wider",
						isDestructive && "text-destructive",
						isSuccess && "text-emerald-500",
					)}
				>
					{title}
				</Text>
			) : null}
			<Text
				className={cn(
					"text-xs leading-relaxed font-medium",
					isDestructive && "text-destructive",
					isSuccess && "text-foreground",
				)}
			>
				{message}
			</Text>
		</View>
	);
}
