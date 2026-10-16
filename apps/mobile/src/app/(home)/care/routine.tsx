import { useLocalSearchParams } from "expo-router";
import { RoutineScreen } from "@/modules/care/components/routine-screen";

/** Care · Morning or night routine (`?routine=night`). */
export default function RoutineRoute() {
	const { routine } = useLocalSearchParams<{ routine?: string }>();
	return <RoutineScreen routine={routine === "night" ? "night" : "morning"} />;
}
