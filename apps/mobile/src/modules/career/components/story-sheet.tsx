import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { deleteStory, saveStory } from "../data/career-actions";
import type { Story } from "../lib/career-model";
import { TextBox } from "./field-rows";

export type StorySheetProps = { visible: boolean; story: Story | null; onClose: () => void };

/** One work story to tell in interviews: a title and the two-minute version. */
export function StorySheet({ visible, story, onClose }: StorySheetProps) {
	const [title, setTitle] = useState(story?.title ?? "");
	const [summary, setSummary] = useState(story?.summary ?? "");
	const [minutes, setMinutes] = useState(String(story?.minutes ?? 2));
	const [error, setError] = useState<string | null>(null);

	const save = async () => {
		const length = Number.parseInt(minutes, 10);
		if (!title.trim()) return setError("Give the story a title, like the project name.");
		if (!(length > 0 && length <= 15)) return setError("Keep it between 1 and 15 minutes.");
		try {
			await saveStory({
				id: story?.id,
				title: title.trim(),
				summary: summary.trim(),
				minutes: length,
			});
			onClose();
		} catch (caught) {
			console.error("[career] could not save the story", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<Sheet
			visible={visible}
			title={story ? "Your story" : "Add a story"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<TextField label="Title" value={title} onChangeText={setTitle} placeholder="Auspira" />
			<TextField
				label="Minutes to tell it"
				value={minutes}
				onChangeText={setMinutes}
				keyboardType="number-pad"
			/>
			<TextBox
				label="The story"
				value={summary}
				onChangeText={setSummary}
				placeholder="What you did, how, and the result — with a number if you have one."
			/>
			<PoText variant="meta13" tone="textTertiary">
				Practise it out loud. The AI uses your stories in nudges and interview prep.
			</PoText>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			{story ? (
				<PillButton
					label="Delete story"
					variant="ghost"
					onPress={() =>
						void deleteStory(story.id)
							.then(onClose)
							.catch((caught: unknown) =>
								console.error("[career] could not delete the story", caught),
							)
					}
				/>
			) : null}
		</Sheet>
	);
}
