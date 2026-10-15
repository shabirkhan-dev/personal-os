import { useLocalSearchParams } from "expo-router";
import { RecipeDetailScreen } from "@/modules/food/components/recipe-detail-screen";

/** Food · One recipe. */
export default function RecipeRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <RecipeDetailScreen id={id ?? ""} />;
}
