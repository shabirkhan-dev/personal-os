import { useLocalSearchParams } from "expo-router";
import { StepEditorScreen } from "@/modules/care/components/step-editor-screen";

/** Care · Write or change a routine step. */
export default function StepRoute() {
	const { routine, id } = useLocalSearchParams<{ routine?: string; id?: string }>();
	return (
		<StepEditorScreen routine={routine === "night" ? "night" : "morning"} id={id || undefined} />
	);
}
