import { Button, type ButtonVariant } from "@/components/ui/button";

export interface AuthButtonProps {
	label: string;
	onPress: () => void;
	pending?: boolean;
	disabled?: boolean;
	variant?: "primary" | "outline" | "ghost" | "destructive";
	className?: string;
}

export function AuthButton({
	label,
	onPress,
	pending = false,
	disabled = false,
	variant = "primary",
	className,
}: AuthButtonProps) {
	const mappedVariant: ButtonVariant =
		variant === "primary" ? "default" : variant === "destructive" ? "destructive" : variant;

	return (
		<Button
			onPress={onPress}
			loading={pending}
			disabled={disabled}
			variant={mappedVariant}
			className={className}
		>
			{label}
		</Button>
	);
}
