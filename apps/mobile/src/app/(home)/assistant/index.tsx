import { useLocalSearchParams } from "expo-router";
import { AssistantScreen } from "@/modules/assistant";

/** The assistant; `?ask=` (from a notification) asks that question as soon as it opens. */
export default function AssistantRoute() {
	const { ask } = useLocalSearchParams<{ ask?: string }>();
	return <AssistantScreen ask={typeof ask === "string" ? ask : undefined} />;
}
