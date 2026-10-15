import { useLocalSearchParams } from "expo-router";
import { FlashcardsScreen } from "@/modules/career/components/flashcards-screen";

/** Career · Flashcards for one application's prep. */
export default function FlashcardsRoute() {
	const { deck } = useLocalSearchParams<{ deck: string }>();
	return <FlashcardsScreen deck={typeof deck === "string" ? deck : ""} />;
}
