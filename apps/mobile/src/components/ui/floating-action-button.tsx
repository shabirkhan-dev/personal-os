import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";

interface FloatingActionButtonProps {
	onPress?: () => void;
	color?: string;
}

export function FloatingActionButton({ onPress, color }: FloatingActionButtonProps) {
	if (!onPress) return null;

	return (
		<View className="absolute bottom-[104px] right-6 z-[999]">
			<Pressable
				onPress={onPress}
				className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-lg active:scale-95 active:opacity-90"
				style={color ? { backgroundColor: color } : undefined}
				accessibilityRole="button"
				accessibilityLabel="Add entry"
			>
				<Icon icon={PlusSignIcon} size={32} className="text-primary-foreground" strokeWidth={2.5} />
			</Pressable>
		</View>
	);
}
