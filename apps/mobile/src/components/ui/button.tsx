import { Pressable, type PressableProps, Text } from "react-native";

interface ButtonProps extends PressableProps {
	label: string;
	variant?: "primary" | "secondary" | "outline";
	className?: string;
}

export function Button({ label, variant = "primary", className, ...props }: ButtonProps) {
	const baseStyles = "px-6 py-3 rounded-xl flex-row items-center justify-center";

	const variantStyles = {
		primary: "bg-black dark:bg-white",
		secondary: "bg-gray-200 dark:bg-gray-800",
		outline: "border border-gray-300 dark:border-gray-700 bg-transparent",
	};

	const textStyles = {
		primary: "text-white dark:text-black font-semibold",
		secondary: "text-black dark:text-white font-semibold",
		outline: "text-black dark:text-white font-semibold",
	};

	return (
		<Pressable className={`${baseStyles} ${variantStyles[variant]} ${className || ""}`} {...props}>
			<Text className={textStyles[variant]}>{label}</Text>
		</Pressable>
	);
}
