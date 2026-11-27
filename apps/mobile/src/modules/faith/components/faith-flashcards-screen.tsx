import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
	CardStack,
	FlipHint,
	RatingRow,
	ReviewProgress,
	useReview,
} from "@/components/flashcard-review";
import { EmptyCard, FilterChip, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { dueCards } from "@/lib/flashcards/schedule";
import { useNow } from "@/lib/use-now";
import { useSpeaker } from "@/lib/voice";
import { addCards, rateCard } from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import type { CardKind } from "../lib/faith-model";
import { templateRoutes } from "@/modules/templates/navigation";
import { faithRoutes } from "../navigation";
import { FaithScreen } from "./faith-screen";

/** Words and duas on spaced review: tap to see the meaning, hear it, then rate it. */
export function FaithFlashcardsScreen() {
	const data = useFaith();
	const now = useNow(30_000);
	const speaker = useSpeaker();
	const { cards } = data;

	const review = useReview(cards, data.loading, rateCard, speaker.stop);
	const [writing, setWriting] = useState(false);
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
					body="Flashcards are optional. Write the words and duas you want to learn, or import a deck you made with any AI from Templates."
				>
					<PillButton label="Write a card" onPress={() => setWriting(true)} />
					<PillButton
						label="Import a deck"
						variant="secondary"
						onPress={() => templateRoutes.browse("faith")}
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
			{cards.length > 0 ? (
				<PillButton label="Write a card" variant="ghost" onPress={() => setWriting(true)} />
			) : null}
			{writing ? <CardSheet onClose={() => setWriting(false)} /> : null}
		</FaithScreen>
	);
}

/** One card in the person's own words: the Arabic, a question, and the meaning. */
function CardSheet({ onClose }: { onClose: () => void }) {
	const [kind, setKind] = useState<CardKind>("word");
	const [front, setFront] = useState("");
	const [prompt, setPrompt] = useState("");
	const [back, setBack] = useState("");
	const [source, setSource] = useState("");
	const ready = front.trim().length > 0 && back.trim().length > 0;
	return (
		<Sheet
			visible
			title="Write a card"
			onClose={onClose}
			footer={
				<PillButton
					label="Add card"
					disabled={!ready}
					onPress={() => {
						onClose();
						void addCards([
							{
								kind,
								front: front.trim(),
								prompt:
									prompt.trim() ||
									(kind === "dua" ? "What does this dua ask for?" : "What does it mean?"),
								back: back.trim(),
								source: source.trim(),
							},
						]).catch((error: unknown) => console.error("[faith] could not add the card", error));
					}}
				/>
			}
		>
			<View style={styles.kinds}>
				<FilterChip label="Word" selected={kind === "word"} onPress={() => setKind("word")} />
				<FilterChip label="Dua" selected={kind === "dua"} onPress={() => setKind("dua")} />
			</View>
			<TextField label="Front (Arabic)" value={front} onChangeText={setFront} placeholder="صَبْر" />
			<TextField
				label="Question"
				value={prompt}
				onChangeText={setPrompt}
				placeholder="What does it mean?"
			/>
			<TextField label="Meaning" value={back} onChangeText={setBack} placeholder="Patience" />
			<TextField
				label="From"
				value={source}
				onChangeText={setSource}
				placeholder="Al-Baqarah 2:153"
			/>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	center: { textAlign: "center" },
	kinds: { flexDirection: "row", gap: 8 },
});
