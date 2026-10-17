import { useLocalSearchParams } from "expo-router";
import { CompareScreen } from "@/modules/wishlist/components/compare-screen";

/** Wishlist · Compare. */
export default function Route() {
	const { a, b } = useLocalSearchParams<{ a?: string; b?: string }>();
	return <CompareScreen a={a || undefined} b={b || undefined} />;
}
