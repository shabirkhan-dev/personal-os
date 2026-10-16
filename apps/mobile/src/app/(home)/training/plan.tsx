import { useLocalSearchParams } from "expo-router";
import { PlanScreen } from "@/modules/workout/components/plan-screen";

/** Training · Session plan (`?template=push-handstand`, else today's). */
export default function Route() {
	const { template } = useLocalSearchParams<{ template?: string }>();
	return <PlanScreen templateId={template} />;
}
