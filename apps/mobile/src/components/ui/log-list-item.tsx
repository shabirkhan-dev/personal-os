import { Pressable, Text, View } from "react-native";
import type { IconProp } from "./icon";
import { Icon } from "./icon";

interface LogListItemProps {
	icon: IconProp;
	iconColor: string;
	title: string;
	subtitle: string;
	value: string;
	delta?: string;
	deltaColor?: string;
	onPress?: () => void;
}

export function LogListItem({
	icon,
	iconColor,
	title,
	subtitle,
	value,
	delta,
	deltaColor,
	onPress,
}: LogListItemProps) {
	return (
		<Pressable
			className="flex-row justify-between items-center py-3.5 border-b border-border/40 active:opacity-70"
			onPress={onPress}
		>
			<View className="flex-row items-center gap-4">
				<View className="w-11 h-11 rounded-full bg-muted/60 justify-center items-center">
					<Icon icon={icon} size={20} color={iconColor} strokeWidth={2} />
				</View>
				<View className="gap-0.5">
					<Text className="text-foreground text-base font-semibold">{title}</Text>
					<Text className="text-muted-foreground text-[13px]">{subtitle}</Text>
				</View>
			</View>
			<View className="items-end gap-0.5">
				<Text className="text-foreground text-base font-semibold font-mono">{value}</Text>
				{delta ? (
					<Text
						className="text-accent-green text-[13px] font-medium"
						style={deltaColor ? { color: deltaColor } : undefined}
					>
						{delta}
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}
