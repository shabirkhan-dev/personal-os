import { useLocalSearchParams } from "expo-router";
import { InterviewPrepScreen } from "@/modules/career/components/interview-prep-screen";

/** Career · Interview prep for one application. */
export default function ApplicationPrepRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <InterviewPrepScreen id={typeof id === "string" ? id : undefined} />;
}
