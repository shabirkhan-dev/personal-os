import { useLocalSearchParams } from "expo-router";
import { TalkScreen } from "@/modules/home/components/talk-screen";

/**
 * Talk to OS: `personalos://listen` (or "Hey OS") opens here, already listening. `?say=` from a
 * link is shown for the person to place, never logged on its own.
 */
export default function ListenRoute() {
	const { say } = useLocalSearchParams<{ say?: string }>();
	return <TalkScreen say={typeof say === "string" ? say : undefined} />;
}
