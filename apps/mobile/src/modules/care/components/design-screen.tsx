import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { RoutinePlan } from "../data/care-actions";
import { useCare } from "../hooks/use-care";
import {
	CONCERN_LABELS,
	CONCERNS,
	type Concern,
	SKIN_LABELS,
	SKIN_TYPES,
	type SkinType,
} from "../lib/care-model";
import { careAiMessage, type RoutineDraftAi, useCareAi } from "../services/care-ai";
import { careRoutes } from "../navigation";
import { CareScreen } from "./care-screen";
import { PlanPreview } from "./plan-preview";

const toggle = <T,>(list: readonly T[], value: T) =>
	list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

function toPlan(draft: RoutineDraftAi): RoutinePlan {
	return {
		steps: draft.steps.map((step) => ({
			...step,
			productId: null,
			short: step.days.length ? (step.name.split(/\s+/)[0]?.slice(0, 8) ?? "") : "",
			photos: [],
		})),
		products: [],
		habits: draft.habits.map((habit) => ({ ...habit, link: null })),
		areas: [],
	};
}

/**
 * Design a routine with AI: what you want to work on, your skin, anything else, then a draft to
 * review. Nothing is saved until you add it.
 */
export function DesignScreen() {
	const { colors } = usePoTheme();
	const data = useCare();
	const ai = useCareAi();
	const [concerns, setConcerns] = useState<Concern[]>(data.settings.concerns);
	const [skin, setSkin] = useState<SkinType[]>(data.settings.skin);
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [draft, setDraft] = useState<{ plan: RoutinePlan; note: string } | null>(null);

	const design = () => {
		setBusy(true);
		setError(null);
		ai.designRoutine({
			concerns: concerns.map((concern) => CONCERN_LABELS[concern]),
			skin: skin.map((type) => SKIN_LABELS[type]),
			notes,
			products: data.products.map((product) => product.name),
		})
			.then((result) => {
				haptics.success();
				setDraft({ plan: toPlan(result), note: result.note });
			})
			.catch((caught: unknown) => setError(careAiMessage(caught)))
			.finally(() => setBusy(false));
	};

	return (
		<CareScreen ask={false}>
			<ScreenTitle eyebrow="Care · with AI" title={draft ? "Your draft" : "Design a routine"} />
			{draft ? (
				<>
					<PlanPreview plan={draft.plan} note={draft.note} />
					<PillButton
						label="Change what I asked for"
						variant="ghost"
						onPress={() => setDraft(null)}
					/>
				</>
			) : (
				<>
					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						<PoText variant="title18">What do you want to work on?</PoText>
						<View style={styles.chips}>
							{CONCERNS.map((concern) => (
								<FilterChip
									key={concern}
									label={CONCERN_LABELS[concern]}
									selected={concerns.includes(concern)}
									onPress={() => setConcerns((list) => toggle(list, concern))}
								/>
							))}
						</View>
						<PoText variant="title18">Your skin</PoText>
						<View style={styles.chips}>
							{SKIN_TYPES.map((type) => (
								<FilterChip
									key={type}
									label={SKIN_LABELS[type]}
									selected={skin.includes(type)}
									onPress={() => setSkin((list) => toggle(list, type))}
								/>
							))}
						</View>
						<TextField
							label="Anything else (optional)"
							value={notes}
							onChangeText={setNotes}
							placeholder="Five minutes max, no fragrance, I already use CeraVe"
							multiline
						/>
						{data.products.length > 0 ? (
							<PoText variant="meta13" tone="textTertiary">
								{`It will use what's on your shelf: ${data.products.map((product) => product.name).join(", ")}.`}
							</PoText>
						) : null}
					</View>
					{error ? (
						<PoText variant="meta13" tone="textDanger" style={styles.pad}>
							{error}
						</PoText>
					) : null}
					{ai.available ? (
						<PillButton
							label={busy ? "Designing…" : "Design my routine"}
							disabled={busy}
							onPress={design}
						/>
					) : (
						<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
							<PoText variant="body15" tone="textSecondary">
								Sign in to design a routine with AI. Without it, start from a template or add your
								own steps.
							</PoText>
							<PillButton
								label="Browse templates"
								variant="secondary"
								onPress={careRoutes.templates}
							/>
						</View>
					)}
				</>
			)}
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 16, borderRadius: 20 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	pad: { paddingHorizontal: 8 },
});
