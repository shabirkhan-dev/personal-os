import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { rateCard } from "../data/career-actions";
import { findApp, useCareer, useNow } from "../hooks/use-career";
import { weekdayShort } from "../lib/career-math";
import {
	dueBefore,
	dueCards,
	formatInterval,
	nextInterval,
	RATINGS,
	type Rating,
} from "../lib/flashcard-schedule";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";
import { EmptyCard, ScreenTitle } from "./career-ui";

const RATING_LABELS: Record<Rating, string> = {
	again: "Again",
	hard: "Hard",
	good: "Good",
	easy: "Easy",
};

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
	// The queue is fixed once the cards have loaded, so a rated card doesn't jump back in at once.
	const [queue, setQueue] = useState<string[] | null>(null);
	useEffect(() => {
		if (queue === null && !data.loading)
			setQueue(dueCards(cards, new Date()).map((card) => card.id));
	}, [queue, data.loading, cards]);
	const [position, setPosition] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [picked, setPicked] = useState<Rating | null>(null);

	const reviewing = queue ?? [];
	const current = cards.find((card) => card.id === reviewing[position]) ?? null;
	const interviewAt = app?.interview ? new Date(app.interview.at) : null;
	const due = interviewAt ? dueBefore(cards, interviewAt) : dueCards(cards, now).length;
	const finished = queue !== null && position >= queue.length;
	const topic = current?.topic || cards[0]?.topic || "Flashcards";

	const rate = (rating: Rating) => {
		if (!current) return;
		haptics.select();
		setPicked(rating);
		void rateCard(current, rating)
			.catch((error: unknown) => console.error("[career] could not save the review", error))
			.finally(() => {
				setFlipped(false);
				setPicked(null);
				setPosition((value) => value + 1);
			});
	};

	return (
		<CareerScreen>
			<ScreenTitle eyebrow="Flashcards · from your interview prep" title={topic} />
			{current && !finished ? (
				<>
					<View style={styles.progress}>
						<View style={styles.progressHead}>
							<PoText variant="mono13" tone="textSecondary" style={styles.flex}>
								Card {Math.min(position + 1, reviewing.length)} of {reviewing.length}
							</PoText>
							<PoText variant="mono13" tone="accentDefault">
								{due} due{interviewAt ? ` · interview ${weekdayShort(interviewAt)}` : ""}
							</PoText>
						</View>
						<View style={styles.segments}>
							{reviewing.map((cardId, index) => (
								<View
									key={cardId}
									style={[
										styles.segment,
										{
											backgroundColor:
												index < position
													? colors.statusSuccess
													: index === position
														? colors.accentDefault
														: colors.borderDefault,
										},
									]}
								/>
							))}
						</View>
					</View>
					<View style={styles.stack}>
						<View style={[styles.back2, { backgroundColor: colors.bgSubtle }]} />
						<View style={[styles.back1, { backgroundColor: colors.bgHover }]} />
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={flipped ? "Answer shown" : "Show the answer"}
							accessibilityHint={flipped ? undefined : "Tap to see the answer"}
							onPress={() => {
								haptics.tap();
								setFlipped((value) => !value);
							}}
							style={[
								styles.card,
								{
									backgroundColor: colors.bgSurface,
									borderColor: flipped ? colors.statusSuccess : colors.borderDefault,
									borderWidth: flipped ? 1.5 : 1,
								},
							]}
						>
							<PoText variant="eyebrow11" tone="textTertiary">
								{current.tag || current.topic}
							</PoText>
							{flipped ? (
								<>
									<PoText variant="row15" tone="textSecondary" style={styles.center}>
										{current.front}
									</PoText>
									<PoText
										variant="title18"
										tone="textSuccess"
										style={[styles.center, styles.answer]}
									>
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
									<View style={[styles.hint, { backgroundColor: colors.bgHover }]}>
										<Icon name="Line/Arrow up" size={14} color={colors.textSecondary} />
										<PoText variant="meta13" tone="textSecondary">
											Tap to see the answer
										</PoText>
									</View>
								</>
							)}
						</Pressable>
					</View>
					<View style={[styles.ratings, { opacity: flipped ? 1 : 0.45 }]}>
						{RATINGS.map((rating) => (
							<Pressable
								key={rating}
								accessibilityRole="button"
								accessibilityLabel={`${RATING_LABELS[rating]}, next in ${formatInterval(nextInterval(current, rating))}`}
								accessibilityState={{ disabled: !flipped }}
								disabled={!flipped}
								onPress={() => rate(rating)}
								style={[
									styles.rating,
									{ backgroundColor: picked === rating ? colors.accentSubtle : colors.bgSubtle },
								]}
							>
								<PoText
									variant="row15"
									tone={
										picked === rating ? "accentDefault" : flipped ? "textPrimary" : "textTertiary"
									}
								>
									{RATING_LABELS[rating]}
								</PoText>
								<PoText variant="mono13" tone="textTertiary">
									{formatInterval(nextInterval(current, rating))}
								</PoText>
							</Pressable>
						))}
					</View>
				</>
			) : (
				<EmptyCard
					icon="Layers"
					title={data.loading ? "Loading…" : cards.length === 0 ? "No cards yet" : "All caught up"}
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
	flex: { flex: 1 },
	center: { textAlign: "center" },
	answer: { lineHeight: 30 },
	progress: { gap: 8 },
	progressHead: { flexDirection: "row" },
	segments: { flexDirection: "row", gap: 4 },
	segment: { flex: 1, height: 4, borderRadius: 2 },
	stack: { height: 440 },
	back2: { position: "absolute", top: 0, left: 26, right: 26, height: 400, borderRadius: 32 },
	back1: { position: "absolute", top: 10, left: 13, right: 13, height: 410, borderRadius: 32 },
	card: {
		position: "absolute",
		top: 24,
		left: 0,
		right: 0,
		height: 416,
		borderRadius: 32,
		padding: 24,
		gap: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
	},
	code: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
	source: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
	ratings: { flexDirection: "row", gap: 8, paddingTop: 4 },
	rating: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 12, borderRadius: 20 },
});
