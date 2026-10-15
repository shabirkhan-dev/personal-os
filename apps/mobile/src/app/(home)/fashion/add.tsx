import { useLocalSearchParams } from "expo-router";
import { AddPieceScreen } from "@/modules/fashion/components/add-piece-screen";

/** Fashion · Add a piece, or edit one with `?edit=<id>`. */
export default function AddRoute() {
	const { edit, category } = useLocalSearchParams<{ edit?: string; category?: string }>();
	return <AddPieceScreen editId={edit} category={category} />;
}
