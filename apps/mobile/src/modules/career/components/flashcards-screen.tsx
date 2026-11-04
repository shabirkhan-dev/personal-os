import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
	CardStack,
	FlipHint,
	RatingRow,
	ReviewProgress,
	useReview,
} from "@/components/flashcard-review";
import { EmptyCard, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { dueBefore, dueCards } from "@/lib/flashcards/schedule";
import { usePoTheme } from "@/theme";
import { rateCard } from "../data/career-actions";
import { findApp, useCareer, useNow } from "../hooks/use-career";
import { weekdayShort } from "../lib/career-math";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";

/** Spaced review of one deck: tap the card to see the answer, then rate it. */
export function FlashcardsScreen({ deck }: { deck: string }) {
	const { colors } = usePoTheme();
	const data = useCareer();
	const now = useNow(30_000);
	const app = findApp(data, deck);
	const cards = useMemo(
		() => data.cards.filter((card) => card.deckId === deck),
		[data.cards, deck],
	);
	const review = useReview(cards, data.loading, rateCard);
	const { current, flipped } = review;
	const interviewAt = app?.interview ? new Date(app.interview.at) : null;
	const due = interviewAt ? dueBefore(cards, interviewAt) : dueCards(cards, now).length;
	const topic = current?.topic || cards[0]?.topic || "Flashcards";

	return (
		<CareerScreen>
			<ScreenTitle eyebrow="Flashcards · from your interview prep" title={topic} />
			{current ? (
				<>
					<ReviewProgress
						review={review}
						due={`${due} due${interviewAt ? ` · interview ${weekdayShort(interviewAt)}` : ""}`}
					/>
					<CardStack
						review={review}
						accessibilityLabel={flipped ? "Answer shown" : "Show the answer"}
					>
						<PoText variant="eyebrow11" tone="textTertiary">
							{current.tag || current.topic}
						</PoText>
						{flipped ? (
							<>
								<PoText variant="row15" tone="textSecondary" style={styles.center}>
									{current.front}
								</PoText>
								<PoText variant="title18" tone="textSuccess" style={[styles.center, styles.answer]}>
									{current.back}
								</PoText>
								{current.code ? (
									<View style={[styles.code, { backgroundColor: colors.bgSubtle }]}>
										<PoText variant="mono13">{current.code}</PoText>
									</View>
								) : null}
								{current.topic ? (
									<View style={[styles.source, { backgroundColor: colors.accentSubtle }]}>
										<PoText variant="meta13" tone="accentDefault">
											Topic: {current.topic}
										</PoText>
									</View>
								) : null}
							</>
						) : (
							<>
								<PoText variant="title30" style={styles.center}>
									{current.front}
								</PoText>
								<FlipHint />
							</>
						)}
					</CardStack>
					<RatingRow review={review} />
				</>
			) : data.loading ? (
				<SkeletonCard lines={3} label="your cards" />
			) : (
				<EmptyCard
					icon="Layers"
					title={cards.length === 0 ? "No cards yet" : "All caught up"}
					body={
						cards.length === 0
							? "Build the interview prep and its flashcards come with it."
							: "Nothing is due right now. The next cards come back on their own schedule."
					}
				>
					<PillButton
						label="Back to prep"
						variant="secondary"
						onPress={() => careerRoutes.prep(app?.id)}
					/>
				</EmptyCard>
			)}
		</CareerScreen>
	);
}

const styles = StyleSheet.create({
	center: { textAlign: "center" },
	answer: { lineHeight: 30 },
	code: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
	source: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
});
