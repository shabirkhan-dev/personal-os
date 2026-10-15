import { useLocalSearchParams } from "expo-router";
import { PieceDetailScreen } from "@/modules/fashion/components/piece-detail-screen";

/** Fashion · Piece detail. */
export default function PieceRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <PieceDetailScreen id={id ?? ""} />;
}
