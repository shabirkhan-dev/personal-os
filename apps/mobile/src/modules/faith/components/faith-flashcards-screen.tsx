import { StyleSheet } from "react-native";
import {
	CardStack,
	FlipHint,
	RatingRow,
	ReviewProgress,
	useReview,
} from "@/components/flashcard-review";
import { EmptyCard, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { dueCards } from "@/lib/flashcards/schedule";
import { useNow } from "@/lib/use-now";
import { useSpeaker } from "@/lib/voice";
import { rateCard, seedCards } from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import { STARTER_CARDS } from "../lib/faith-content";
import { faithRoutes } from "../navigation";
import { FaithScreen } from "./faith-screen";

/** Words and duas on spaced review: tap to see the meaning, hear it, then rate it. */
export function FaithFlashcardsScreen() {
	const data = useFaith();
	const now = useNow(30_000);
	const speaker = useSpeaker();
	const { cards } = data;

	const review = useReview(cards, data.loading, rateCard, speaker.stop);
	const { current, flipped } = review;

	return (
		<FaithScreen>
			<ScreenTitle eyebrow="Flashcards · words and duas" title="Review" />
			{current ? (
				<>
					<ReviewProgress review={review} due={`${dueCards(cards, now).length} due today`} />
					<CardStack
						review={review}
						accessibilityLabel={flipped ? `${current.back}. ${current.source}` : current.prompt}
					>
						<PoText variant="eyebrow11" tone="textTertiary">
							{`${current.kind === "dua" ? "Dua" : "Word"} · from ${current.source}`}
						</PoText>
						<PoText
							variant={current.kind === "dua" ? "arabic30" : "arabic56"}
							style={styles.center}
						>
							{current.front}
						</PoText>
						{flipped ? (
							<PoText variant="title18" tone="textSuccess" style={styles.center}>
								{current.back}
							</PoText>
						) : (
							<>
								<PoText variant="body15" tone="textSecondary">
									{current.prompt}
								</PoText>
								<FlipHint />
							</>
						)}
						{speaker.available ? (
							<MetaChip
								icon={speaker.speaking === current.id ? "Pause" : "Filled/Play"}
								label={speaker.speaking === current.id ? "Stop" : "Hear it"}
								onPress={() =>
									speaker.speaking === current.id
										? speaker.stop()
										: speaker.speak(current.id, [{ text: current.front, lang: "ar", rate: 0.8 }])
								}
							/>
						) : null}
					</CardStack>
					<RatingRow review={review} />
				</>
			) : !data.loading && cards.length === 0 ? (
				<EmptyCard
					icon="Layers"
					title="No cards yet"
					body={`Flashcards are optional. Add the starter deck of ${STARTER_CARDS.length} words and duas from short surahs if you'd like to learn them.`}
				>
					<PillButton
						label="Add the starter deck"
						onPress={() =>
							void seedCards(cards).catch((error: unknown) =>
								console.error("[faith] could not add the starter cards", error),
							)
						}
					/>
					<PillButton label="Back to Grow" variant="secondary" onPress={faithRoutes.grow} />
				</EmptyCard>
			) : (
				<EmptyCard
					icon="Layers"
					title={data.loading || !review.ready ? "Getting your cards…" : "All caught up"}
					body="Nothing is due right now. Cards come back on their own schedule, a little further apart each time."
				>
					<PillButton label="Back to Grow" variant="secondary" onPress={faithRoutes.grow} />
				</EmptyCard>
			)}
		</FaithScreen>
	);
}

const styles = StyleSheet.create({
	center: { textAlign: "center" },
});
