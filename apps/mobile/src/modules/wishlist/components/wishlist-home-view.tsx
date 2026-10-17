import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { ActionPills, EmptyCard } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { useWishlistToday } from "../hooks/use-wishlist";
import { useWishlistUi } from "../hooks/wishlist-ui-store";
import { parseWishLine } from "../lib/parse-wish-line";
import { categoryCounts, compactMoney, progressPercent } from "../lib/wishlist-math";
import type { DreamCategory } from "../lib/wishlist-model";
import { wishlistRoutes } from "../navigation";
import {
	CategoryChips,
	DreamListCard,
	GarageRow,
	RulesCard,
	StartCard,
	UpNextCard,
} from "./home-cards";

const QUESTION = /\?\s*$|^(what|which|when|should|how)\b/i;

/** Wishlist Home: ask bar, up next, the list by when, the rules and the garage. */
export function WishlistHomeView({ actionRequest }: HomeModuleViewProps) {
	const { data, funding, now, stops, monthly } = useWishlistToday();
	const setDraft = useWishlistUi((state) => state.setDraft);
	const [filter, setFilter] = useState<DreamCategory | "all">("all");
	const { settings, dreams, owned } = data;
	const next = stops[0] ?? null;

	const submit = (text: string) => {
		if (QUESTION.test(text.trim())) {
			wishlistRoutes.roadmap();
			return;
		}
		setDraft({ ...parseWishLine(text), text });
		wishlistRoutes.add();
	};

	// The header's right button: put money aside for whatever is up next.
	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		if (next) wishlistRoutes.dream(next.dream.id, true);
		else wishlistRoutes.add();
	}, [actionRequest, next]);

	// A line said on Talk to OS that belongs here.
	const inboxLine = useAskInbox((state) => state.line);
	useEffect(() => {
		if (inboxLine?.module !== "wishlist") return;
		const line = useAskInbox.getState().take("wishlist");
		if (line) submit(line.text);
		// oxlint-disable-next-line react/exhaustive-deps -- runs when a line arrives
	}, [inboxLine]);

	const counts = useMemo(() => categoryCounts(dreams), [dreams]);
	const listed = useMemo(
		() => stops.slice(1).filter((stop) => filter === "all" || stop.dream.category === filter),
		[stops, filter],
	);

	const ask = (
		<>
			<AskBar
				placeholder="Add a dream or ask what's first…"
				suggestions={[]}
				onSubmit={(text) => submit(text)}
			/>
			<ActionPills
				actions={[
					{ label: "Add", icon: "Filled/Plus", onPress: wishlistRoutes.add },
					{ label: "Roadmap", icon: "List", onPress: wishlistRoutes.roadmap },
					{ label: "Garage", icon: "Settings", onPress: wishlistRoutes.garage },
				]}
			/>
		</>
	);

	if (data.error) {
		return (
			<>
				{ask}
				<EmptyCard
					icon="Help"
					title="Couldn't open your list"
					body="Something went wrong reading Wishlist on this phone. Close the app and open it again; nothing was deleted."
				/>
			</>
		);
	}

	if (data.loading) {
		return (
			<>
				{ask}
				<PoText variant="meta13" tone="textTertiary" style={styles.loading}>
					Loading your list…
				</PoText>
			</>
		);
	}

	if (!next) {
		return (
			<>
				{ask}
				<StartCard
					onPick={(starter) => {
						setDraft({ ...parseWishLine(starter.text), text: starter.text, name: "" });
						wishlistRoutes.add();
					}}
				/>
				<RulesCard coolOffDays={settings.coolOffDays} />
				{owned.length > 0 ? (
					<GarageRow
						owned={owned[0] ?? null}
						count={owned.length}
						now={now}
						onPress={wishlistRoutes.garage}
					/>
				) : null}
			</>
		);
	}

	const saved = next.dream.savedAmount;
	const note =
		saved > 0
			? `${compactMoney(saved)} saved · ${progressPercent(next.dream)}%`
			: monthly <= 0
				? "Set your income in Finance to see when"
				: funding.incomeExpected
					? "Saving starts with the first salary"
					: "";

	return (
		<>
			{ask}
			<UpNextCard
				stop={next}
				now={now}
				note={note}
				onPress={() => wishlistRoutes.dream(next.dream.id)}
			/>
			{stops.length > 1 ? (
				<CategoryChips counts={counts} total={stops.length} value={filter} onChange={setFilter} />
			) : null}
			{listed.length > 0 ? (
				<DreamListCard
					stops={listed}
					now={now}
					onOpen={(dream) => wishlistRoutes.dream(dream.id)}
				/>
			) : stops.length > 1 ? (
				<PoText variant="meta13" tone="textTertiary" style={styles.loading}>
					Nothing else in this category yet.
				</PoText>
			) : null}
			<RulesCard coolOffDays={settings.coolOffDays} />
			<GarageRow
				owned={owned[0] ?? null}
				count={owned.length}
				now={now}
				onPress={wishlistRoutes.garage}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	loading: { paddingHorizontal: 6 },
});
