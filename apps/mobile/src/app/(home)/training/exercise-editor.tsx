import { useLocalSearchParams } from "expo-router";
import { ExerciseEditorScreen } from "@/modules/workout/components/exercise-editor-screen";

/** Training · Make or edit an exercise (`?id=` for an existing one). */
export default function Route() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	return <ExerciseEditorScreen id={id} />;
}
