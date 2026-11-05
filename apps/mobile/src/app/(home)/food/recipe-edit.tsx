import { useLocalSearchParams } from "expo-router";
import { RecipeEditorScreen } from "@/modules/food/components/recipe-editor-screen";

/** Food · Write or edit a recipe of your own. */
export default function RecipeEditRoute() {
	const { id, copy } = useLocalSearchParams<{ id?: string; copy?: string }>();
	return <RecipeEditorScreen id={id || undefined} copy={copy || undefined} />;
}
