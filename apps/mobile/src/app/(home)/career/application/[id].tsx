import { useLocalSearchParams } from "expo-router";
import { ApplicationDetailScreen } from "@/modules/career/components/application-detail-screen";

/** Career · Application detail. */
export default function ApplicationRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <ApplicationDetailScreen id={typeof id === "string" ? id : ""} />;
}
