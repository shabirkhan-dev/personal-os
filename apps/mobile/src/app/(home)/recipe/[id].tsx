import { useLocalSearchParams } from "expo-router";
import { RecipeDetailScreen } from "@/modules/food/components/recipe-detail-screen";

/** Food · Recipe detail. */
export default function RecipeRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <RecipeDetailScreen id={typeof id === "string" ? id : ""} />;
}
