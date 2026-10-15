import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import {
	FilterChip,
	IconTile,
	ListCard,
	ListRow,
	ScreenTitle,
	SectionLabel,
} from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { addDays, dayKey } from "@/lib/day";
import { dueCards } from "@/lib/flashcards/schedule";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import {
	removeResource,
	saveResource,
	startChallenge,
	toggleChallengeDay,
	toggleLesson,
} from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import { CHALLENGES, type LearningPath, PATHS, STARTER_CARDS } from "../lib/faith-content";
import { challengeDay, challengeShare, daysAgo } from "../lib/faith-math";
import { RESOURCE_KINDS, type Resource, type ResourceKind } from "../lib/faith-model";
import { faithRoutes } from "../navigation";
import { FaithScreen } from "./faith-screen";

const KIND_LABEL: Record<ResourceKind, string> = {
	note: "Note",
	link: "Link",
	audio: "Audio",
	pdf: "PDF",
};
const KIND_ICON: Record<ResourceKind, IconName> = {
	note: "Filled/Edit",
	link: "Copy",
	audio: "Mic",
	pdf: "Download",
};
const KIND_TONE = {
	note: { tone: "statusSuccess", tile: "statusSuccessSubtle" },
	link: { tone: "statusViolet", tile: "statusVioletSubtle" },
	audio: { tone: "accentDefault", tile: "accentSubtle" },
	pdf: { tone: "statusCaution", tile: "statusCautionSubtle" },
} as const;

/** Grow in faith: the current challenge, learning paths and the person's own notes and links. */
export function GrowScreen() {
	const { colors } = usePoTheme();
	const { challenge, progress, resources, cards } = useFaith();
	const now = useNow();
	const [filter, setFilter] = useState<ResourceKind | "all">("all");
	const [picking, setPicking] = useState(false);
	const [path, setPath] = useState<LearningPath | null>(null);
	const [editing, setEditing] = useState<{ key: number; resource: Resource | null } | null>(null);

	const due = cards.length === 0 ? STARTER_CARDS.length : dueCards(cards, now).length;
	const shown = useMemo(
		() => (filter === "all" ? resources : resources.filter((item) => item.kind === filter)),
		[filter, resources],
	);
	const today = dayKey(now);
	const doneToday = challenge?.done.includes(today) ?? false;

	const edit = (resource: Resource | null) =>
		setEditing((current) => ({ key: (current?.key ?? 0) + 1, resource }));

	const open = (resource: Resource) => {
		if (resource.url) {
			Linking.openURL(resource.url).catch((error: unknown) => {
				console.warn("[faith] could not open the link", error);
				Alert.alert("Couldn't open that link", resource.url);
			});
		} else edit(resource);
	};

	return (
		<FaithScreen
			action={{ icon: "Line/Plus", label: "Add a note or link", onPress: () => edit(null) }}
		>
			<ScreenTitle eyebrow="Challenges · paths · resources" title="Grow in faith" />

			<SectionLabel>Challenge</SectionLabel>
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{challenge ? (
					<>
						<View style={styles.head}>
							<IconTile name="Star" tone="statusSuccess" tile="statusSuccessSubtle" />
							<View style={styles.flex}>
								<PoText variant="row15">{challenge.title}</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{challenge.detail} · day {challengeDay(challenge, now)} of {challenge.days}
								</PoText>
							</View>
							<PoText variant="mono13" tone="textSuccess">
								{Math.round(challengeShare(challenge) * 100)}%
							</PoText>
						</View>
						<View style={styles.days}>
							{Array.from({ length: challenge.days }, (_, step) =>
								dayKey(addDays(new Date(`${challenge.startedOn}T12:00:00`), step)),
							).map((day) => (
								<View
									key={day}
									style={[
										styles.day,
										challenge.done.includes(day)
											? { backgroundColor: colors.statusSuccess }
											: day === today
												? { borderWidth: 1.5, borderColor: colors.accentDefault }
												: { backgroundColor: colors.bgSubtle },
									]}
								/>
							))}
						</View>
						<View style={styles.actions}>
							<PillButton
								label={doneToday ? "Done today ✓" : "Mark today done"}
								onPress={() => {
									haptics.success();
									void toggleChallengeDay(challenge).catch((error: unknown) =>
										console.error("[faith] could not save", error),
									);
								}}
								style={styles.flex}
							/>
							<PillButton
								label="New challenge"
								variant="secondary"
								onPress={() => setPicking(true)}
								style={styles.flex}
							/>
						</View>
					</>
				) : (
					<>
						<PoText variant="row15">Pick a challenge</PoText>
						<PoText variant="meta13" tone="textSecondary">
							A small daily step for a few weeks. Mark each day done and watch the grid fill.
						</PoText>
						<PillButton label="Choose one" onPress={() => setPicking(true)} />
					</>
				)}
			</View>

			<SectionLabel>Paths</SectionLabel>
			<ListCard>
				<ListRow
					icon={{ name: "Layers", tone: "accentDefault", tile: "accentSubtle" }}
					title="Flashcards · words and duas"
					subtitle="Ten cards from what you've read"
					value={due > 0 ? `${due} due` : "All done"}
					valueTone="accentDefault"
					onPress={faithRoutes.flashcards}
				/>
				{PATHS.map((item, index) => {
					const done = progress.find((entry) => entry.id === item.id)?.done.length ?? 0;
					return (
						<ListRow
							key={item.id}
							icon={{
								name: item.id === "beliefs" ? "Star" : item.id === "surahs" ? "Mic" : "Layers",
								tone: item.id === "beliefs" ? "statusCaution" : "accentDefault",
								tile: item.id === "beliefs" ? "statusCautionSubtle" : "accentSubtle",
							}}
							title={item.title}
							subtitle={done > 0 ? `${done} of ${item.lessons.length} lessons` : item.summary}
							value={done > 0 ? `${Math.round((done / item.lessons.length) * 100)}%` : "Start"}
							valueTone={done > 0 ? "accentDefault" : "textSecondary"}
							last={index === PATHS.length - 1}
							onPress={() => setPath(item)}
						/>
					);
				})}
			</ListCard>

			<SectionLabel>{`Resources · ${resources.length}`}</SectionLabel>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filters}
			>
				<FilterChip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
				{RESOURCE_KINDS.map((kind) => {
					const count = resources.filter((item) => item.kind === kind).length;
					return count > 0 ? (
						<FilterChip
							key={kind}
							label={`${KIND_LABEL[kind]}s ${count}`}
							selected={filter === kind}
							onPress={() => setFilter(kind)}
						/>
					) : null;
				})}
			</ScrollView>
			{shown.map((resource) => (
				<Pressable
					key={resource.id}
					accessibilityRole="button"
					onPress={() => open(resource)}
					onLongPress={() => edit(resource)}
					style={[
						styles.resource,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<IconTile
						name={KIND_ICON[resource.kind]}
						tone={KIND_TONE[resource.kind].tone}
						tile={KIND_TONE[resource.kind].tile}
					/>
					<View style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{KIND_LABEL[resource.kind]}
						</PoText>
						<PoText variant="row15">{resource.title}</PoText>
						{resource.body ? (
							<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
								{resource.body}
							</PoText>
						) : null}
						<PoText variant="mono13" tone="textTertiary">
							{resource.url
								? "Tap to open · hold to edit"
								: `Edited ${daysAgo(resource.updatedAt, now)}`}
						</PoText>
					</View>
				</Pressable>
			))}
			<Pressable
				accessibilityRole="button"
				onPress={() => edit(null)}
				style={[styles.add, { borderColor: colors.borderDefault }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					Add a note or link
				</PoText>
			</Pressable>

			<Sheet visible={picking} title="New challenge" onClose={() => setPicking(false)}>
				{challenge ? (
					<PoText variant="meta13" tone="textSecondary">
						Starting a new one replaces “{challenge.title}”.
					</PoText>
				) : null}
				<ListCard>
					{CHALLENGES.map((template, index) => (
						<ListRow
							key={template.title}
							title={template.title}
							subtitle={`${template.detail} · ${template.days} days`}
							chevron
							last={index === CHALLENGES.length - 1}
							onPress={() => {
								setPicking(false);
								void startChallenge(template).catch((error: unknown) =>
									console.error("[faith] could not start", error),
								);
							}}
						/>
					))}
				</ListCard>
			</Sheet>

			{path ? (
				<PathSheet
					path={path}
					done={progress.find((entry) => entry.id === path.id)?.done ?? []}
					onClose={() => setPath(null)}
				/>
			) : null}
			{editing ? (
				<ResourceSheet
					key={editing.key}
					resource={editing.resource}
					onClose={() => setEditing(null)}
				/>
			) : null}
		</FaithScreen>
	);
}

function PathSheet({
	path,
	done,
	onClose,
}: {
	path: LearningPath;
	done: readonly string[];
	onClose: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Sheet
			visible
			title={path.title}
			onClose={onClose}
			action={{ label: "Done", onPress: onClose }}
		>
			<PoText variant="meta13" tone="textSecondary">
				{path.summary}. Tick a lesson when it's done; add notes in Resources.
			</PoText>
			<ListCard>
				{path.lessons.map((lesson, index) => {
					const checked = done.includes(lesson.id);
					return (
						<ListRow
							key={lesson.id}
							title={lesson.title}
							subtitle={lesson.detail}
							dimmed={checked}
							last={index === path.lessons.length - 1}
							leading={
								<View
									style={[
										styles.check,
										checked
											? { backgroundColor: colors.accentDefault, borderColor: colors.accentDefault }
											: { borderColor: colors.borderStrong },
									]}
								>
									{checked ? (
										<Icon name="Check bold" size={12} color={colors.textOnAccent} />
									) : null}
								</View>
							}
							onPress={() =>
								void toggleLesson(path.id, lesson.id, { id: path.id, done: [...done] }).catch(
									(error: unknown) => console.error("[faith] could not save the lesson", error),
								)
							}
						/>
					);
				})}
			</ListCard>
		</Sheet>
	);
}

function ResourceSheet({ resource, onClose }: { resource: Resource | null; onClose: () => void }) {
	const [kind, setKind] = useState<ResourceKind>(resource?.kind ?? "note");
	const [title, setTitle] = useState(resource?.title ?? "");
	const [body, setBody] = useState(resource?.body ?? "");
	const [url, setUrl] = useState(resource?.url ?? "");
	const urlOk = !url.trim() || /^https?:\/\/\S+$/i.test(url.trim());
	const canSave = title.trim().length > 0 && urlOk;

	return (
		<Sheet
			visible
			title={resource ? "Edit" : "Add to resources"}
			onClose={onClose}
			footer={
				<View style={styles.actions}>
					{resource ? (
						<PillButton
							label="Delete"
							variant="secondary"
							onPress={() => {
								void removeResource(resource).catch((error: unknown) =>
									console.error("[faith] could not delete", error),
								);
								onClose();
							}}
							style={styles.flex}
						/>
					) : null}
					<PillButton
						label="Save"
						disabled={!canSave}
						onPress={() => {
							void saveResource({
								...(resource ? { id: resource.id, createdAt: resource.createdAt } : {}),
								kind,
								title,
								body,
								url,
							}).catch((error: unknown) => console.error("[faith] could not save", error));
							onClose();
						}}
						style={styles.flex}
					/>
				</View>
			}
		>
			<ChoiceChips
				label="Kind"
				options={RESOURCE_KINDS.map((value) => ({ value, label: KIND_LABEL[value] }))}
				value={kind}
				onChange={setKind}
			/>
			<TextField
				label="Title"
				value={title}
				onChangeText={setTitle}
				placeholder="My prayer notes"
			/>
			<TextField
				label="Notes"
				value={body}
				onChangeText={setBody}
				placeholder="In your own words"
			/>
			<TextField
				label="Link (optional)"
				value={url}
				onChangeText={setUrl}
				placeholder="https://…"
				keyboardType="url"
			/>
			{urlOk ? null : (
				<PoText variant="meta13" tone="textDanger">
					Links start with https://
				</PoText>
			)}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 14, padding: 18, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 12 },
	days: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	day: { width: "8.6%", aspectRatio: 1, borderRadius: 6 },
	actions: { flexDirection: "row", gap: 8 },
	filters: { gap: 8 },
	resource: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 24, borderWidth: 1 },
	add: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 52,
		borderRadius: 26,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	check: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
});
