import { useLocalSearchParams } from "expo-router";
import { DreamDetailScreen } from "@/modules/wishlist/components/dream-detail-screen";

/** Wishlist · Dream detail. */
export default function Route() {
	const { id, save } = useLocalSearchParams<{ id: string; save?: string }>();
	return <DreamDetailScreen id={id} openSave={save === "1"} />;
}
