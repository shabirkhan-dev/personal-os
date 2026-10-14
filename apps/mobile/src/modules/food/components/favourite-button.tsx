import { Pressable, StyleSheet } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { foodActions, useFoodStore } from "../store/food-store";

export type FavouriteButtonProps = {
	recipeId: string;
	recipeName: string;
	/** 40 in the detail header, 36 on cards. */
	size?: 36 | 40;
};

/** Heart that saves a recipe to the "Saved" filter. */
export function FavouriteButton({ recipeId, recipeName, size = 36 }: FavouriteButtonProps) {
	const { colors } = usePoTheme();
	const saved = useFoodStore((state) => state.data.favourites.includes(recipeId));
	const onHeader = size === 40;

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={saved ? `Remove ${recipeName} from saved` : `Save ${recipeName}`}
			accessibilityState={{ selected: saved }}
			hitSlop={6}
			onPress={() => {
				haptics.select();
				foodActions.toggleFavourite(recipeId);
			}}
			style={({ pressed }) => [
				styles.button,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderWidth: onHeader ? 1 : 0,
					borderColor: colors.borderDefault,
					backgroundColor: pressed ? colors.bgHover : onHeader ? colors.bgSurface : colors.bgSubtle,
				},
			]}
		>
			<Icon
				name="Heart"
				size={onHeader ? 20 : 16}
				color={saved ? colors.statusDanger : colors.textPrimary}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: { alignItems: "center", justifyContent: "center" },
});
