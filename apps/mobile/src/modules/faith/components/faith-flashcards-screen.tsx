import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import {
	dueCards,
	formatInterval,
	nextInterval,
	RATINGS,
	type Rating,
} from "@/lib/flashcards/schedule";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { useSpeaker } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import { rateCard, seedCards } from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import { faithRoutes } from "../navigation";
import { FaithScreen } from "./faith-screen";

const RATING_LABELS: Record<Rating, string> = {
	again: "Again",
	hard: "Hard",
	good: "Good",
	easy: "Easy",
};

/** Words and duas on spaced review: tap to see the meaning, hear it, then rate it. */
export function FaithFlashcardsScreen() {
	const { colors } = usePoTheme();
	const data = useFaith();
	const now = useNow(30_000);
	const speaker = useSpeaker();
	const { cards } = data;

	// The first visit adds the starter deck.
	const seeded = useRef(false);
	useEffect(() => {
		if (data.loading || seeded.current) return;
		seeded.current = true;
		if (cards.length === 0) {
			seedCards(cards).catch((error: unknown) =>
				console.error("[faith] could not add the starter cards", error),
			);
		}
	}, [data.loading, cards]);

	// The queue is fixed once cards load, so a rated card doesn't jump straight back in.
	const [queue, setQueue] = useState<string[] | null>(null);
	useEffect(() => {
		if (queue === null && !data.loading && cards.length > 0)
			setQueue(dueCards(cards, new Date()).map((card) => card.id));
	}, [queue, data.loading, cards]);
	const [position, setPosition] = useState(0);
	const [flipped, setFlipped] = useState(false);

	const reviewing = queue ?? [];
	const current = cards.find((card) => card.id === reviewing[position]) ?? null;
	const finished = queue !== null && position >= queue.length;
	const due = dueCards(cards, now).length;

	const rate = (rating: Rating) => {
		if (!current) return;
		haptics.select();
		speaker.stop();
		void rateCard(current, rating)
			.catch((error: unknown) => console.error("[faith] could not save the review", error))
			.finally(() => {
				setFlipped(false);
				setPosition((value) => value + 1);
			});
	};

	return (
		<FaithScreen>
			<ScreenTitle eyebrow="Flashcards · words and duas" title="Review" />
			{current && !finished ? (
				<>
					<View style={styles.progressHead}>
						<PoText variant="mono13" tone="textSecondary" style={styles.flex}>
							Card {position + 1} of {reviewing.length}
						</PoText>
						<PoText variant="mono13" tone="accentDefault">
							{due} due today
						</PoText>
					</View>
					<View style={styles.segments}>
						{reviewing.map((id, index) => (
							<View
								key={id}
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
					<View style={styles.stack}>
						<View style={[styles.back2, { backgroundColor: colors.bgSubtle }]} />
						<View style={[styles.back1, { backgroundColor: colors.bgHover }]} />
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={flipped ? `${current.back}. ${current.source}` : current.prompt}
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
									<View style={styles.hint}>
										<Icon name="Line/Arrow up" size={14} color={colors.textSecondary} />
										<PoText variant="meta13" tone="textSecondary">
											Tap to see the answer
										</PoText>
									</View>
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
								style={[styles.rating, { backgroundColor: colors.bgSubtle }]}
							>
								<PoText variant="row15" tone={flipped ? "textPrimary" : "textTertiary"}>
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
					title={data.loading || queue === null ? "Getting your cards…" : "All caught up"}
					body="Nothing is due right now. Cards come back on their own schedule, a little further apart each time."
				>
					<PillButton label="Back to Grow" variant="secondary" onPress={faithRoutes.grow} />
				</EmptyCard>
			)}
		</FaithScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	center: { textAlign: "center" },
	progressHead: { flexDirection: "row" },
	segments: { flexDirection: "row", gap: 4 },
	segment: { flex: 1, height: 4, borderRadius: 2 },
	stack: { height: 420 },
	back2: { position: "absolute", top: 0, left: 26, right: 26, height: 380, borderRadius: 32 },
	back1: { position: "absolute", top: 10, left: 13, right: 13, height: 390, borderRadius: 32 },
	card: {
		position: "absolute",
		top: 24,
		left: 0,
		right: 0,
		height: 396,
		borderRadius: 32,
		padding: 24,
		gap: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: { flexDirection: "row", alignItems: "center", gap: 6 },
	ratings: { flexDirection: "row", gap: 8, paddingTop: 4 },
	rating: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 12, borderRadius: 20 },
});
