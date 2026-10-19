import { useLocalSearchParams } from "expo-router";
import { AddDreamScreen } from "@/modules/wishlist/components/add-dream-screen";

/** Wishlist · Add dream (or edit one with `?edit=<id>`). */
export default function Route() {
	const { edit } = useLocalSearchParams<{ edit?: string }>();
	return <AddDreamScreen editId={edit || undefined} />;
}
