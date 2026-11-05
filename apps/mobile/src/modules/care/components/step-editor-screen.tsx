import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { forgetLocalPhoto } from "@/lib/photos/pick-photo";
import { usePoTheme } from "@/theme";
import { deleteStep, saveStep } from "../data/care-actions";
import { useCare } from "../hooks/use-care";
import { type Area, AREAS, AREA_LABELS, type Routine, type Step } from "../lib/care-model";
import { CareScreen } from "./care-screen";
import { PhotoStrip } from "./photo-strip";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = {
	name: string;
	detail: string;
	howTo: string;
	photos: string[];
	minutes: string;
	area: Area;
	days: number[];
	productId: string | null;
	routine: Routine;
};

const fromStep = (step: Step): Draft => ({
	name: step.name,
	detail: step.detail,
	howTo: step.howTo,
	photos: step.photos,
	minutes: String(step.minutes),
	area: step.area,
	days: step.days,
	productId: step.productId,
	routine: step.routine,
});

/**
 * One routine step, written the person's way: a name and a short line, photos of how it's done,
 * how to apply it, minutes, the area, which days, and the product from the shelf it uses.
 */
export function StepEditorScreen({ routine, id }: { routine: Routine; id?: string }) {
	const { colors } = usePoTheme();
	const data = useCare();
	const existing = id ? data.steps.find((step) => step.id === id) : undefined;
	const [draft, setDraft] = useState<Draft>(() =>
		existing
			? fromStep(existing)
			: {
					name: "",
					detail: "",
					howTo: "",
					photos: [],
					minutes: "1",
					area: "face",
					days: [],
					productId: null,
					routine,
				},
	);
	const [loaded, setLoaded] = useState(Boolean(!id || existing));
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (loaded || !existing) return;
		setDraft(fromStep(existing));
		setLoaded(true);
	}, [loaded, existing]);

	const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

	const save = () => {
		const name = draft.name.trim();
		if (!name) {
			setNotice("Give the step a name.");
			return;
		}
		saveStep({
			...(existing ? { id: existing.id } : {}),
			routine: draft.routine,
			area: draft.area,
			name,
			detail: draft.detail.trim(),
			howTo: draft.howTo.trim(),
			photos: draft.photos,
			productId: draft.productId,
			minutes: Math.min(60, Math.max(0, Math.round(Number(draft.minutes) || 0))),
			days: draft.days,
			short:
				draft.days.length > 0 ? existing?.short || (name.split(/\s+/)[0]?.slice(0, 8) ?? "") : "",
			order: existing?.order ?? data.steps.filter((step) => step.routine === draft.routine).length,
		})
			.then(() => {
				for (const photo of existing?.photos ?? []) {
					if (!draft.photos.includes(photo)) forgetLocalPhoto(photo);
				}
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[care] could not save the step", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	const remove = () => {
		if (!existing) return;
		showDialog(`Delete ${existing.name}?`, "Days you already ticked stay in your history.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () =>
					void deleteStep(existing)
						.then(() => {
							for (const photo of existing.photos) forgetLocalPhoto(photo);
							router.back();
						})
						.catch((error: unknown) => console.error("[care] could not delete the step", error)),
			},
		]);
	};

	return (
		<CareScreen ask={false}>
			<ScreenTitle
				eyebrow={draft.routine === "night" ? "Night routine" : "Morning routine"}
				title={existing ? "Edit step" : "Add a step"}
			/>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<TextField
					label="Name"
					value={draft.name}
					onChangeText={(name) => set({ name })}
					placeholder="Vitamin C serum"
				/>
				<TextField
					label="Short line (optional)"
					value={draft.detail}
					onChangeText={(detail) => set({ detail })}
					placeholder="3 drops · let it dry"
				/>
				<PoText variant="meta13" tone="textSecondary">
					When
				</PoText>
				<View style={styles.chips}>
					<FilterChip
						label="Morning"
						selected={draft.routine === "morning"}
						onPress={() => set({ routine: "morning" })}
					/>
					<FilterChip
						label="Night"
						selected={draft.routine === "night"}
						onPress={() => set({ routine: "night" })}
					/>
				</View>
			</View>

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="title18">How to apply</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Photos of how you do it or what it looks like, and the steps in your own words.
				</PoText>
				<PhotoStrip photos={draft.photos} onChange={(photos) => set({ photos })} />
				<TextField
					label="Instructions or a note"
					value={draft.howTo}
					onChangeText={(howTo) => set({ howTo })}
					placeholder="Three drops on dry skin, press in, wait a minute before moisturiser."
					multiline
				/>
			</View>

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<TextField
					label="Minutes"
					value={draft.minutes}
					onChangeText={(minutes) => set({ minutes })}
					keyboardType="number-pad"
					suffix="min"
				/>
				<PoText variant="meta13" tone="textSecondary">
					Area
				</PoText>
				<View style={styles.chips}>
					{AREAS.map((area) => (
						<FilterChip
							key={area}
							label={AREA_LABELS[area]}
							selected={draft.area === area}
							onPress={() => set({ area })}
						/>
					))}
				</View>
				<PoText variant="meta13" tone="textSecondary">
					Days (none picked means every day)
				</PoText>
				<View style={styles.chips}>
					{WEEKDAYS.map((label, day) => (
						<FilterChip
							key={label}
							label={label}
							selected={draft.days.includes(day)}
							onPress={() =>
								set({
									days: draft.days.includes(day)
										? draft.days.filter((item) => item !== day)
										: [...draft.days, day].sort((a, b) => a - b),
								})
							}
						/>
					))}
				</View>
				{data.products.length > 0 ? (
					<>
						<PoText variant="meta13" tone="textSecondary">
							Product from your shelf
						</PoText>
						<View style={styles.chips}>
							<FilterChip
								label="None"
								selected={draft.productId === null}
								onPress={() => set({ productId: null })}
							/>
							{data.products.map((product) => (
								<FilterChip
									key={product.id}
									label={product.name}
									selected={draft.productId === product.id}
									onPress={() => set({ productId: product.id })}
								/>
							))}
						</View>
					</>
				) : null}
			</View>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			<Footer>
				{existing ? (
					<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
				) : null}
				<PillButton label="Save step" style={styles.flex} onPress={save} />
			</Footer>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0 },
	pad: { paddingHorizontal: 8 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
