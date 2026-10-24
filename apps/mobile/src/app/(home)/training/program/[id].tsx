import { useLocalSearchParams } from "expo-router";
import { ProgramScreen } from "@/modules/workout/components/program-screen";

/** Training · One program. */
export default function Route() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <ProgramScreen id={id ?? ""} />;
}
