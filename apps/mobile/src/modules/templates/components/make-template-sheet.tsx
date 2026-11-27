import { makeTemplateFile, type TemplateKind } from "@personal-os/domain/templates";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { useAi } from "@/lib/ai/use-ai";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { haptics } from "@/lib/haptics";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { formatOf, templatePrompt } from "../lib/template-formats";
import { readTemplateText } from "../lib/template-files";
import { useTemplateStore } from "../lib/template-store";
import { templateRoutes } from "../navigation";

const AI_TIMEOUT_MS = 120_000;

/**
 * Making one kind of template: say what you want, then either let your AI make it here, or copy
 * the prompt into any AI (ChatGPT, Claude, Gemini…) and paste its reply back. Either way you see a
 * preview and pick what to add.
 */
export function MakeTemplateSheet({ kind, onClose }: { kind: TemplateKind; onClose: () => void }) {
	const format = formatOf(kind);
	const ai = useAi();
	const open = useTemplateStore((state) => state.open);
	const author = useOnboardingStore((state) => state.name.trim());
	const [want, setWant] = useState("");
	const [reply, setReply] = useState("");
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<{ text: string; good: boolean } | null>(null);

	const preview = (text: string) => {
		const result = readTemplateText(text.trim());
		if (!result.ok) {
			setNotice({ text: result.reason, good: false });
			return;
		}
		if (result.file.kind !== kind) {
			setNotice({
				text: `That's a ${formatOf(result.file.kind).label.toLowerCase()} template; opening it.`,
				good: true,
			});
		}
		const pack = open(result.file);
		if (pack.items.length === 0) {
			setNotice({
				text: "Nothing in it could be read. Ask the AI to follow the format exactly.",
				good: false,
			});
			return;
		}
		onClose();
		templateRoutes.pack(pack.id);
	};

	const copy = async () => {
		await Clipboard.setStringAsync(templatePrompt(kind, want));
		haptics.success();
		setNotice({
			text: "Copied. Paste it into ChatGPT, Claude or Gemini, then paste the reply below.",
			good: true,
		});
	};

	const makeHere = async () => {
		setBusy(true);
		setNotice(null);
		try {
			const made = await ai.run<{ title: string; summary: string; items: unknown[] }>(
				"templates/make",
				{ kind, prompt: templatePrompt(kind, want) },
				AI_TIMEOUT_MS,
			);
			const file = makeTemplateFile({
				kind,
				title: made.title || format.label,
				summary: made.summary,
				author,
				items: made.items,
			});
			const pack = open(file);
			if (pack.items.length === 0) {
				setNotice({
					text: "The AI's answer couldn't be used. Try again, or ask for less.",
					good: false,
				});
				return;
			}
			haptics.success();
			onClose();
			templateRoutes.pack(pack.id);
		} catch (error) {
			console.warn("[templates] making a template failed", error);
			setNotice({
				text: aiLimitMessage(error) ?? "AI couldn't make it just now. Try again in a moment.",
				good: false,
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<Sheet visible title={format.label} onClose={onClose}>
			<View style={styles.body}>
				<PoText variant="meta13" tone="textSecondary">
					{format.what}
				</PoText>
				<TextField
					label="What do you want?"
					value={want}
					onChangeText={setWant}
					placeholder={format.ask}
					multiline
				/>
				{ai.available ? (
					<PillButton
						label={busy ? "Making it…" : "Make it with my AI"}
						disabled={busy}
						onPress={makeHere}
					/>
				) : null}
				<PillButton label="Copy the prompt for any AI" variant="secondary" onPress={copy} />
				<TextField
					label="Paste the AI's reply"
					value={reply}
					onChangeText={setReply}
					placeholder='{ "kind": "…", "items": [ … ] }'
					multiline
					plain
				/>
				<PillButton
					label="Preview it"
					variant="secondary"
					disabled={reply.trim().length < 10}
					onPress={() => preview(reply)}
				/>
				{notice ? (
					<PoText variant="meta13" tone={notice.good ? "textSecondary" : "textWarning"}>
						{notice.text}
					</PoText>
				) : null}
				{!ai.available ? (
					<PoText variant="meta13" tone="textTertiary">
						Add your own AI key in Profile to make it right here, no account needed.
					</PoText>
				) : null}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	body: { gap: 12, paddingBottom: 8 },
});
