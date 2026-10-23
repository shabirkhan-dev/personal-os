import { useLocalSearchParams } from "expo-router";
import { ProgramBuilderScreen } from "@/modules/workout/components/program-builder-screen";

/** Training · Design a program (`?id=` to edit one, `?ai=1` to start with AI). */
export default function Route() {
	const { id, ai } = useLocalSearchParams<{ id?: string; ai?: string }>();
	return <ProgramBuilderScreen id={id} ai={ai === "1"} />;
}
