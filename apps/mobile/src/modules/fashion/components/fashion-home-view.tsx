import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AiWorkingCard } from "@/components/ai-working-card";
import { ActionPills, ReadError, ResultCard } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { haptics } from "@/lib/haptics";
import {
	currentPlace,
	LOCATE_FAILURE_MESSAGE,
	LOCATE_STAGE_LABEL,
} from "@/lib/location/current-place";
import { voiceOut } from "@/lib/voice";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { addFromCatalog, saveSettings, undoWear, wearLook } from "../data/fashion-actions";
import { FASHION_ASK_JOB, useFashionUi } from "../hooks/fashion-ui-store";
import { useFashionToday } from "../hooks/use-fashion-today";
import { QUICK_ADD } from "../lib/catalog";
import { colourHeadline, colourStory, daysSinceWorn, idlePieces } from "../lib/fashion-math";
import type { Wear } from "../lib/fashion-model";
import { layerAdvice, lookPieceIds, sprays } from "../lib/outfits";
import { parseFashionLine } from "../lib/parse-fashion-line";
import { feel } from "../lib/weather";
import { fashionRoutes } from "../navigation";
import { fashionAiMessage, useFashionAi } from "../services/fashion-ai";
import { AnswerCard } from "./answer-card";
import { CapsuleCard, ClosetCard, ColourStoryCard, TodayLookCard, WishlistRow } from "./home-cards";

const ASK_STEPS = [
	"Looking through your wardrobe",
	"Checking the weather",
	"Putting a look together",
] as const;

type Logged = { quote: string; wear: Wear; previous: Wear | null };

/** Fashion Home: ask bar, today's look for the weather, colour story, closet and wishlist. */
export function FashionHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, weather, now, context, looks, worn } = useFashionToday();
	const { pieces, wears, wishes, settings } = data;
	const ui = useFashionUi();
	const ai = useFashionAi();
	const askJob = useAiJobs((state) => state.jobs[FASHION_ASK_JOB]);
	const startJob = useAiJobs((state) => state.start);
	const retryJob = useAiJobs((state) => state.retry);
	const dismissJob = useAiJobs((state) => state.dismiss);
	const [notice, setNotice] = useState<string | null>(null);
	const [logged, setLogged] = useState<Logged | null>(null);
	const [picked, setPicked] = useState<string[]>(QUICK_ADD.slice(0, 4));
	const [adding, setAdding] = useState(false);
	const [locating, setLocating] = useState<string | null>(null);
	const [locateError, setLocateError] = useState<string | null>(null);

	const locate = async () => {
		setLocateError(null);
		const result = await currentPlace((stage) => setLocating(LOCATE_STAGE_LABEL[stage]));
		setLocating(null);
		if (!result.ok) {
			setLocateError(LOCATE_FAILURE_MESSAGE[result.reason]);
			return;
		}
		saveSettings({ ...settings, place: result.place }).catch((error: unknown) => {
			console.error("[fashion] could not save the place", error);
			setLocateError("Couldn't save on this phone. Try again.");
		});
	};

	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		fashionRoutes.add();
	}, [actionRequest]);

	const index = looks.length > 0 ? ui.lookIndex % looks.length : 0;
	const look = looks[index] ?? null;
	const wornLook = useMemo(() => {
		if (!worn) return null;
		const byId = new Map(pieces.map((piece) => [piece.id, piece]));
		const items = worn.pieceIds.flatMap((id) => {
			const piece = byId.get(id);
			return piece ? [piece] : [];
		});
		return {
			name: worn.look || "Today's look",
			clothes: items.filter((piece) =>
				["layer", "top", "bottom", "shoes"].includes(piece.category),
			),
			watch: items.find((piece) => piece.category === "watch") ?? null,
			scent: items.find((piece) => piece.category === "scent") ?? null,
			layer: items.some((piece) => piece.category === "layer"),
		};
	}, [worn, pieces]);
	const shown = wornLook ?? look;

	const view = useMemo(() => {
		const story = colourStory(pieces);
		const idle = idlePieces(pieces, wears, now)[0];
		const idleDays = idle ? daysSinceWorn(idle.id, wears, now) : null;
		return {
			story,
			headline: colourHeadline(story),
			idleLine: idle
				? `${idle.name}: ${idleDays === null ? "not worn yet" : `not worn in ${idleDays} days`}`
				: null,
			closet: pieces
				.filter((piece) => ["top", "layer", "bottom", "shoes"].includes(piece.category))
				.slice(-8)
				.reverse(),
		};
	}, [pieces, wears, now]);

	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};

	const wear = async (name: string, pieceIds: readonly string[], quote: string, spoken = false) => {
		try {
			const result = await wearLook(name, pieceIds);
			haptics.success();
			setLogged({ quote, wear: result, previous: worn });
			setNotice(null);
			if (spoken) voiceOut.speak(`Logged ${name} for today.`);
		} catch (error) {
			console.error("[fashion] could not log the outfit", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	const ask = (question: string, spoken: boolean) => {
		if (!ai.available) {
			const first = looks[0];
			say(
				first
					? `Offline pick: ${first.name}, ${first.clothes.map((piece) => piece.name.toLowerCase()).join(", ")}.`
					: "Add a few tops and bottoms and I'll put looks together.",
				spoken,
			);
			return;
		}
		setNotice(null);
		ui.setAnswer(null);
		const forecast = weather.forecast;
		const daily = forecast?.days.find((item) => item.day === context.day);
		startJob(FASHION_ASK_JOB, "Picking what to wear", async () => {
			try {
				const answer = await ai.ask({
					question,
					wardrobe: pieces.map((piece) => ({
						name: piece.name,
						category: piece.category,
						colour: piece.colour,
						lastWornDaysAgo: daysSinceWorn(piece.id, wears, now),
					})),
					weather:
						forecast && daily
							? {
									now: forecast.now.temp,
									high: daily.high,
									low: daily.low,
									summary: feel(forecast.now.temp),
								}
							: null,
				});
				useFashionUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(fashionAiMessage(error), { cause: error });
			}
		});
	};

	const onLine = (text: string, spoken: boolean) => {
		const intent = parseFashionLine(text, pieces);
		if (!intent) return;
		if (intent.kind === "wore") {
			void wear(
				worn?.look || "Today's look",
				[...(worn?.pieceIds ?? []), ...intent.pieceIds],
				text,
				spoken,
			);
			return;
		}
		if (intent.kind === "add") {
			ui.setDraft(intent.text);
			fashionRoutes.add();
			return;
		}
		if (intent.kind === "open") {
			fashionRoutes[intent.screen]();
			return;
		}
		ask(intent.text, spoken);
	};

	// A line said on Talk to OS lands here once the wardrobe has loaded.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (data.loading || inboxLine?.module !== "fashion") return;
		const line = useAskInbox.getState().take("fashion");
		if (line) onLine(line.text, line.spoken);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine, data.loading]);

	const empty = !data.loading && pieces.length === 0;
	const advice =
		context.weather && shown
			? layerAdvice(context.weather, shown.layer ? (shown.clothes[0]?.name ?? null) : null)
			: null;
	const firstWish = wishes[0];

	if (data.error) return <ReadError name="Fashion" />;

	return (
		<>
			<View style={styles.ask}>
				<AskBar
					suggestions={[]}
					placeholder="Ask what to wear or log an outfit…"
					onSubmit={onLine}
				/>
				<ActionPills
					actions={[
						{ label: "Plan week", icon: "Filled/Calendar", onPress: fashionRoutes.plan },
						{ label: "Add item", icon: "Line/Plus", onPress: () => fashionRoutes.add() },
						{ label: "Wishlist", icon: "Tag", onPress: fashionRoutes.wishlist },
					]}
				/>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			{weather.place === null && !empty ? (
				<View style={styles.weatherRow}>
					<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
						{locating ?? locateError ?? "Looks dress for the weather once I know where you are."}
					</PoText>
					<PillButton
						label={locating ? "Finding…" : "Use my location"}
						variant="secondary"
						disabled={locating !== null}
						onPress={() => void locate()}
					/>
				</View>
			) : null}
			{logged ? (
				<ResultCard
					quote={logged.quote}
					offline={!ai.available}
					rows={[
						{
							title: logged.wear.look || "Today's look",
							subtitle: logged.wear.pieceIds
								.map((id) => pieces.find((piece) => piece.id === id)?.name)
								.filter(Boolean)
								.join(" · "),
							value: "Worn",
						},
					]}
					onUndo={() => {
						void undoWear(logged.previous, logged.wear).catch((error: unknown) =>
							console.error("[fashion] undo failed", error),
						);
						setLogged(null);
					}}
					onDone={() => setLogged(null)}
				/>
			) : null}
			{askJob ? (
				<AiWorkingCard
					job={askJob}
					steps={ASK_STEPS}
					onRetry={() => retryJob(FASHION_ASK_JOB)}
					onDismiss={() => dismissJob(FASHION_ASK_JOB)}
				/>
			) : ui.answer ? (
				<AnswerCard
					question={ui.answer.question}
					answer={ui.answer.answer}
					followUps={ui.answer.followUps}
					outfit={ui.answer.outfit
						.map((name) => pieces.find((piece) => piece.name.toLowerCase() === name.toLowerCase()))
						.filter((piece) => piece !== undefined)}
					onWear={(items) => {
						void wear(
							"AI pick",
							items.map((piece) => piece.id),
							ui.answer?.question ?? "",
						);
						ui.setAnswer(null);
					}}
					onFollowUp={(question) => ask(question, false)}
					onDone={() => ui.setAnswer(null)}
				/>
			) : null}

			{empty ? (
				<CapsuleCard
					picked={picked}
					options={QUICK_ADD}
					busy={adding}
					onToggle={(id) =>
						setPicked((current) =>
							current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
						)
					}
					onAdd={() => {
						setAdding(true);
						addFromCatalog(picked)
							.then(() => haptics.success())
							.catch((error: unknown) => {
								console.error("[fashion] quick add failed", error);
								setNotice("Couldn't save on this phone. Try again.");
							})
							.finally(() => setAdding(false));
					}}
					onOwn={() => fashionRoutes.add()}
				/>
			) : shown ? (
				<TodayLookCard
					look={shown}
					index={index}
					total={wornLook ? 1 : looks.length}
					weather={context.weather}
					advice={advice}
					hour={now.getHours()}
					sprays={shown.scent ? sprays(shown.scent, context.weather) : 0}
					worn={wornLook !== null}
					onWear={() => look && void wear(look.name, lookPieceIds(look), look.name)}
					onNext={() => {
						if (wornLook && worn) {
							void undoWear(null, worn).catch((error: unknown) =>
								console.error("[fashion] could not change", error),
							);
							return;
						}
						haptics.tap();
						ui.nextLook(looks.length);
					}}
					onPiece={(piece) => fashionRoutes.piece(piece.id)}
				/>
			) : (
				<View style={styles.missing}>
					<PoText variant="body15" tone="textSecondary">
						Looks need at least one top and one bottom. Add them and today's look appears here.
					</PoText>
					<PillButton label="Add a piece" onPress={() => fashionRoutes.add()} />
				</View>
			)}

			{pieces.length >= 3 ? <ColourStoryCard headline={view.headline} story={view.story} /> : null}
			{view.closet.length > 0 ? (
				<ClosetCard
					pieces={view.closet}
					count={pieces.length}
					idle={view.idleLine}
					onPiece={(piece) => fashionRoutes.piece(piece.id)}
					onAll={fashionRoutes.wardrobe}
				/>
			) : null}
			{firstWish ? (
				<WishlistRow
					first={firstWish}
					count={wishes.length}
					paused={settings.buyingPaused}
					onPress={fashionRoutes.wishlist}
				/>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	ask: { gap: 12 },
	notice: { paddingHorizontal: 6 },
	missing: { gap: 12, padding: 18 },
	flex: { flex: 1 },
	weatherRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 6 },
});
