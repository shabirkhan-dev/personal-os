import type * as React from "react";
import { Text, View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
	title?: string;
	description?: string;
	children?: React.ReactNode;
	className?: string;
}

export function Card({ title, description, children, className, ...props }: CardProps) {
	return (
		<View
			className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm ${className || ""}`}
			{...props}
		>
			{title && <Text className="text-xl font-bold text-black dark:text-white mb-1">{title}</Text>}
			{description && <Text className="text-gray-500 dark:text-gray-400 mb-4">{description}</Text>}
			<View>{children}</View>
		</View>
	);
}
