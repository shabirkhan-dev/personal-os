import { useLocalSearchParams } from "expo-router";
import { SessionScreen } from "@/modules/workout/components/session-screen";

/** Training · One logged session. */
export default function Route() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <SessionScreen id={id ?? ""} />;
}
