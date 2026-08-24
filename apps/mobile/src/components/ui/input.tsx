import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
	className?: string;
	error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
	return (
		<TextInput
			className={cn(
				"bg-muted/40 border border-border text-foreground px-4 py-3.5 rounded-2xl text-sm font-medium",
				"placeholder:text-muted-foreground",
				error && "border-destructive",
				className,
			)}
			{...props}
		/>
	);
}
