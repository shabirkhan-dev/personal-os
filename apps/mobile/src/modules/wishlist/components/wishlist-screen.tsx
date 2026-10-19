import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { wishlistRoutes } from "../navigation";

export type WishlistScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Wishlist screen: the shared module shell with the Wishlist pill and Insights. */
export function WishlistScreen({ insightsActive = false, ...props }: WishlistScreenProps) {
	return (
		<ModuleScreen
			label="Wishlist"
			onHome={wishlistRoutes.today}
			insights={{ onPress: wishlistRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
