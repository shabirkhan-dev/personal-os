import { type ReactNode, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import {
	dueCards,
	formatInterval,
	nextInterval,
	RATINGS,
	type Rating,
	type Scheduled,
} from "@/lib/flashcards/schedule";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

const RATING_LABELS: Record<Rating, string> = {
	again: "Again",
	hard: "Hard",
	good: "Good",
	easy: "Easy",
};

type Card = Scheduled & { id: string };

/**
 * One review session over `cards`: the queue is fixed once they load, so a rated card doesn't
 * jump straight back in. `save` stores the rating; the session moves on whether or not it works.
 */
export function useReview<C extends Card>(
	cards: readonly C[],
	loading: boolean,
	save: (card: C, rating: Rating) => Promise<unknown>,
	onRate?: () => void,
) {
	const [queue, setQueue] = useState<string[] | null>(null);
	useEffect(() => {
		if (queue === null && !loading && cards.length > 0)
			setQueue(dueCards(cards, new Date()).map((card) => card.id));
	}, [queue, loading, cards]);
	const [position, setPosition] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [picked, setPicked] = useState<Rating | null>(null);

	const ids = queue ?? [];
	const current = cards.find((card) => card.id === ids[position]) ?? null;
	const finished = queue !== null && position >= ids.length;

	const rate = (rating: Rating) => {
		if (!current) return;
		haptics.select();
		onRate?.();
		setPicked(rating);
		void save(current, rating)
			.catch((error: unknown) => console.error("[flashcards] could not save the review", error))
			.finally(() => {
				setFlipped(false);
				setPicked(null);
				setPosition((value) => value + 1);
			});
	};

	return {
		ids,
		position,
		current: finished ? null : current,
		/** True once the queue is known (an empty deck never gets one). */
		ready: queue !== null,
		flipped,
		flip: () => {
			haptics.tap();
			setFlipped((value) => !value);
		},
		picked,
		rate,
	};
}

export type Review<C extends Card> = ReturnType<typeof useReview<C>>;

/** "Card 3 of 8 · 5 due" and one segment per card, done ones green. */
export function ReviewProgress({ review, due }: { review: Review<Card>; due: string }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.progress}>
			<View style={styles.progressHead}>
				<PoText variant="mono13" tone="textSecondary" style={styles.flex}>
					Card {Math.min(review.position + 1, review.ids.length)} of {review.ids.length}
				</PoText>
				<PoText variant="mono13" tone="accentDefault">
					{due}
				</PoText>
			</View>
			<View style={styles.segments}>
				{review.ids.map((id, index) => (
					<View
						key={id}
						style={[
							styles.segment,
							{
								backgroundColor:
									index < review.position
										? colors.statusSuccess
										: index === review.position
											? colors.accentDefault
											: colors.borderDefault,
							},
						]}
					/>
				))}
			</View>
		</View>
	);
}

/** The card on its two-card stack; tapping flips it. The face is the module's own. */
export function CardStack({
	review,
	accessibilityLabel,
	children,
}: {
	review: Review<Card>;
	accessibilityLabel: string;
	children: ReactNode;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.stack}>
			<View style={[styles.back2, { backgroundColor: colors.bgSubtle }]} />
			<View style={[styles.back1, { backgroundColor: colors.bgHover }]} />
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={review.flipped ? undefined : "Tap to see the answer"}
				onPress={review.flip}
				style={[
					styles.card,
					{
						backgroundColor: review.flipped ? colors.statusSuccessSubtle : colors.bgSurface,
					},
				]}
			>
				{children}
			</Pressable>
		</View>
	);
}

/** The "Tap to see the answer" pill on a card's front. */
export function FlipHint() {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.hint, { backgroundColor: colors.bgHover }]}>
			<Icon name="Line/Arrow up" size={14} color={colors.textSecondary} />
			<PoText variant="meta13" tone="textSecondary">
				Tap to see the answer
			</PoText>
		</View>
	);
}

/** Again · Hard · Good · Easy, each with when the card comes back; live once the card flips. */
export function RatingRow({ review }: { review: Review<Card> }) {
	const { colors } = usePoTheme();
	const { current, flipped, picked } = review;
	if (!current) return null;
	return (
		<View style={[styles.ratings, { opacity: flipped ? 1 : 0.45 }]}>
			{RATINGS.map((rating) => {
				const next = formatInterval(nextInterval(current, rating));
				return (
					<Pressable
						key={rating}
						accessibilityRole="button"
						accessibilityLabel={`${RATING_LABELS[rating]}, next in ${next}`}
						accessibilityState={{ disabled: !flipped }}
						disabled={!flipped}
						onPress={() => review.rate(rating)}
						style={[
							styles.rating,
							{ backgroundColor: picked === rating ? colors.accentSubtle : colors.bgSubtle },
						]}
					>
						<PoText
							variant="row15"
							tone={picked === rating ? "accentDefault" : flipped ? "textPrimary" : "textTertiary"}
						>
							{RATING_LABELS[rating]}
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{next}
						</PoText>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	progress: { gap: 8 },
	progressHead: { flexDirection: "row" },
	segments: { flexDirection: "row", gap: 4 },
	segment: { flex: 1, height: 4, borderRadius: 2 },
	stack: { height: 440 },
	back2: { position: "absolute", top: 0, left: 26, right: 26, height: 400, borderRadius: 20 },
	back1: { position: "absolute", top: 10, left: 13, right: 13, height: 410, borderRadius: 20 },
	card: {
		position: "absolute",
		top: 24,
		left: 0,
		right: 0,
		height: 416,
		borderRadius: 20,
		padding: 16,
		gap: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 999,
	},
	ratings: { flexDirection: "row", gap: 8, paddingTop: 4 },
	rating: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 12, borderRadius: 20 },
});
