import { useLocalSearchParams } from "expo-router";
import { PackScreen } from "@/modules/templates/components/pack-screen";

/** Templates · one pack: preview it and pick what to add. */
export default function PackRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <PackScreen id={id ?? ""} />;
}
