import { useLocalSearchParams } from "expo-router";
import { TalkScreen } from "@/modules/home/components/talk-screen";

/**
 * Talk to OS: `personalos://listen` (or "Hey OS") opens here, already listening. `?say=` carries
 * what was said right after "Hey OS", which is handled at once.
 */
export default function ListenRoute() {
	const { say } = useLocalSearchParams<{ say?: string }>();
	return <TalkScreen say={typeof say === "string" ? say : undefined} />;
}
