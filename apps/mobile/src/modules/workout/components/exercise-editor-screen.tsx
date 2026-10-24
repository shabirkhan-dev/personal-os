import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useAuth } from "@/modules/auth";
import { usePoTheme } from "@/theme";
import { deleteExercise, saveExercise } from "../data/training-actions";
import { useTraining } from "../hooks/use-training";
import {
	CATALOG,
	type CatalogExercise,
	driveFileId,
	EQUIPMENT,
	EQUIPMENT_LABELS,
	type Equipment,
	type ExerciseMedia,
	type ExerciseUnit,
	exerciseById,
	PATTERN_LABELS,
	PATTERNS,
	type Pattern,
} from "../lib/exercise-guide";
import { mediaTypeOf, uploadMedia } from "../services/media-upload";
import { DrivePlayer } from "./drive-player";
import { ExerciseDemo } from "./exercise-demo";
import { Card } from "./home-cards";
import { trainingRoutes } from "../navigation";
import { TrainingScreen } from "./training-screen";

const UNITS: readonly { id: ExerciseUnit; label: string }[] = [
	{ id: "reps", label: "Reps" },
	{ id: "s", label: "Seconds" },
	{ id: "min", label: "Minutes" },
];
const PICKABLE: readonly Pattern[] = PATTERNS.filter((pattern) => pattern !== "sport");

type Draft = {
	name: string;
	pattern: Pattern;
	level: number;
	unit: ExerciseUnit;
	each: boolean;
	weighted: boolean;
	equipment: Equipment[];
	cues: [string, string, string];
	media: ExerciseMedia;
};

function draftOf(exercise: CatalogExercise | null): Draft {
	return {
		name: exercise?.name ?? "",
		pattern: exercise?.pattern ?? "conditioning",
		level: exercise?.level ?? 3,
		unit: exercise?.unit ?? "reps",
		each: exercise?.each ?? false,
		weighted: exercise?.weighted ?? false,
		equipment: [...(exercise?.equipment ?? [])],
		cues: [...(exercise?.cues ?? ["", "", ""])] as [string, string, string],
		media: { ...exercise?.media },
	};
}

function Section({ title, hint }: { title: string; hint?: string }) {
	return (
		<View style={styles.section}>
			<PoText variant="row15">{title}</PoText>
			{hint ? (
				<PoText variant="meta13" tone="textSecondary">
					{hint}
				</PoText>
			) : null}
		</View>
	);
}

/**
 * Make an exercise, or improve a built-in one: name, category, level, unit and equipment (own
 * exercises), cues, and media: a photo or animation uploaded to the app's storage, or a Google
 * Drive video link.
 */
export function ExerciseEditorScreen({ id }: { id?: string }) {
	const { colors } = usePoTheme();
	const { token, status } = useAuth();
	const data = useTraining();
	const builtIn = id ? (CATALOG.find((exercise) => exercise.id === id) ?? null) : null;
	const current = id ? exerciseById(id) : null;
	const isOwn = !builtIn;
	const [draft, setDraft] = useState<Draft>(() => draftOf(current));
	// Filled once saved exercises have loaded, so changes to a built-in one show when editing it.
	const loaded = useRef(!id);
	const [uploading, setUploading] = useState<"image" | "animation" | null>(null);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const signedIn = status === "signed-in" && token !== null;

	// An exercise that loads after the first render (synced data).
	useEffect(() => {
		if (loaded.current || data.loading || !current) return;
		loaded.current = true;
		setDraft(draftOf(current));
	}, [current, data.loading]);

	const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
		setDraft((previous) => ({ ...previous, [key]: value }));
	const setMedia = (change: Partial<ExerciseMedia>) =>
		setDraft((previous) => {
			const media = { ...previous.media, ...change };
			for (const key of Object.keys(media) as (keyof ExerciseMedia)[]) {
				if (!media[key]) delete media[key];
			}
			return { ...previous, media };
		});

	const pick = async (slot: "image" | "animation") => {
		if (!signedIn || !token) {
			setNotice("Sign in from Profile to upload media. You can paste a link instead.");
			return;
		}
		setNotice(null);
		try {
			const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permission.granted) {
				setNotice("Allow photo access in Settings to pick a file.");
				return;
			}
			// No editing, so an animated GIF stays animated.
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				quality: slot === "animation" ? 1 : 0.8,
			});
			const asset = result.canceled ? null : result.assets[0];
			if (!asset) return;
			const type = mediaTypeOf(asset.mimeType, asset.uri);
			if (!type) {
				setNotice("Pick a JPEG, PNG, WebP or GIF.");
				return;
			}
			setUploading(slot);
			const url = await uploadMedia(token, { uri: asset.uri, type });
			setMedia({ [slot]: url });
			haptics.success();
		} catch (error) {
			console.error("[training] media upload failed", error);
			setNotice(error instanceof Error ? error.message : "The upload failed. Try again.");
		} finally {
			setUploading(null);
		}
	};

	const save = async () => {
		const name = draft.name.trim();
		if (isOwn && name.length < 2) {
			setNotice("Give it a name.");
			return;
		}
		if (isOwn && data.savedExercises.some((item) => item.name === name && item.id !== id)) {
			setNotice("You already have an exercise with that name.");
			return;
		}
		if (draft.media.video && !driveFileId(draft.media.video)) {
			setNotice("The video link must be a Google Drive file link.");
			return;
		}
		const cues = draft.cues.map((cue) => cue.trim()) as [string, string, string];
		const media = Object.keys(draft.media).length > 0 ? { media: draft.media } : {};
		const exercise: CatalogExercise = builtIn
			? { ...builtIn, cues: cues.some(Boolean) ? cues : builtIn.cues, ...media }
			: {
					id: id ?? `u-${newId()}`,
					name,
					pattern: draft.pattern,
					level: draft.level,
					equipment: draft.equipment,
					unit: draft.unit,
					...(draft.each ? { each: true } : {}),
					...(draft.weighted ? { weighted: true } : {}),
					demo: null,
					photo: "handstand",
					cues,
					...media,
					custom: true,
				};
		setSaving(true);
		setNotice(null);
		try {
			await saveExercise(exercise);
			haptics.success();
			trainingRoutes.back("/training/exercises");
		} catch (error) {
			console.error("[training] could not save the exercise", error);
			setNotice("Couldn't save on this phone. Try again.");
			setSaving(false);
		}
	};

	const remove = () => {
		if (!id) return;
		Alert.alert(
			isOwn ? `Delete ${draft.name || "this exercise"}?` : "Reset to the built-in version?",
			isOwn
				? "Programs that use it skip it from now on. Logged sets stay."
				: "Your cues and media for it are removed.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: isOwn ? "Delete" : "Reset",
					style: "destructive",
					onPress: () => {
						deleteExercise(id)
							.then(() => trainingRoutes.back("/training/exercises"))
							.catch((error: unknown) => {
								console.error("[training] could not delete the exercise", error);
								setNotice("Couldn't save on this phone. Try again.");
							});
					},
				},
			],
		);
	};

	const mediaRow = (slot: "image" | "animation", label: string) => {
		const value = draft.media[slot];
		return (
			<View style={styles.media}>
				<View style={styles.mediaHead}>
					<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
						{value ? `${label} added` : label}
					</PoText>
					{value ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={`Remove the ${label.toLowerCase()}`}
							onPress={() => setMedia({ [slot]: undefined })}
							hitSlop={8}
						>
							<Icon name="Line/Close" size={16} color={colors.textSecondary} />
						</Pressable>
					) : null}
				</View>
				<PillButton
					label={
						uploading === slot
							? "Uploading…"
							: value
								? `Replace ${label.toLowerCase()}`
								: `Upload ${label.toLowerCase()}`
					}
					variant="secondary"
					disabled={uploading !== null}
					accessory={
						uploading === slot ? (
							<ActivityIndicator size="small" color={colors.textPrimary} />
						) : undefined
					}
					onPress={() => void pick(slot)}
				/>
				<TextField
					label={`Or a link to the ${label.toLowerCase()}`}
					value={value ?? ""}
					onChangeText={(text) => setMedia({ [slot]: text.trim() || undefined })}
					placeholder="https://…"
				/>
			</View>
		);
	};

	const previewName = isOwn ? draft.name : (builtIn?.name ?? "");

	return (
		<TrainingScreen>
			<ScreenTitle
				eyebrow={isOwn ? (id ? "Your exercise" : "New exercise") : "Built-in exercise"}
				title={previewName || "Make an exercise"}
			/>
			{previewName && (draft.media.image || draft.media.animation) ? (
				<ExerciseDemo name={previewName} photo="handstand" height={200} radius={24} />
			) : null}
			{isOwn ? (
				<Card>
					<TextField
						label="Name"
						value={draft.name}
						onChangeText={(text) => set("name", text)}
						placeholder="Ring muscle-up"
					/>
					<Section title="Category" />
					<View style={styles.wrap}>
						{PICKABLE.map((pattern) => (
							<FilterChip
								key={pattern}
								label={PATTERN_LABELS[pattern]}
								selected={draft.pattern === pattern}
								onPress={() => set("pattern", pattern)}
							/>
						))}
					</View>
					<Section title="Counted in" />
					<View style={styles.wrap}>
						{UNITS.map((unit) => (
							<FilterChip
								key={unit.id}
								label={unit.label}
								selected={draft.unit === unit.id}
								onPress={() => set("unit", unit.id)}
							/>
						))}
						<FilterChip
							label="Each side"
							selected={draft.each}
							onPress={() => set("each", !draft.each)}
						/>
						<FilterChip
							label="With weight (kg)"
							selected={draft.weighted}
							onPress={() => set("weighted", !draft.weighted)}
						/>
					</View>
					<Section
						title={`Level ${draft.level} of 10`}
						hint="1 is anyone, 10 is years of practice."
					/>
					<View style={styles.wrap}>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
							<FilterChip
								key={level}
								label={String(level)}
								selected={draft.level === level}
								onPress={() => set("level", level)}
							/>
						))}
					</View>
					<Section title="Needs" hint="Leave empty for bodyweight anywhere." />
					<View style={styles.wrap}>
						{EQUIPMENT.map((item) => (
							<FilterChip
								key={item}
								label={EQUIPMENT_LABELS[item]}
								selected={draft.equipment.includes(item)}
								onPress={() =>
									set(
										"equipment",
										draft.equipment.includes(item)
											? draft.equipment.filter((other) => other !== item)
											: [...draft.equipment, item],
									)
								}
							/>
						))}
					</View>
				</Card>
			) : null}
			<Card>
				<Section title="How to do it" hint="Three short cues, shown during workouts." />
				{draft.cues.map((cue, index) => (
					<TextField
						key={`cue-${index + 1}`}
						label={`Cue ${index + 1}`}
						value={cue}
						onChangeText={(text) => {
							const cues = [...draft.cues] as [string, string, string];
							cues[index] = text.slice(0, 100);
							set("cues", cues);
						}}
						placeholder={index === 0 ? "Hands under the shoulders" : ""}
					/>
				))}
			</Card>
			<Card>
				<Section
					title="Photo and animation"
					hint="JPEG, PNG, WebP or GIF up to 15 MB. Kept for offline use after the first view."
				/>
				{mediaRow("image", "Photo")}
				{mediaRow("animation", "Animation")}
			</Card>
			<Card>
				<Section
					title="Video"
					hint="Paste a Google Drive link. Share the file as “Anyone with the link” so it can play."
				/>
				<TextField
					label="Google Drive link"
					value={draft.media.video ?? ""}
					onChangeText={(text) => setMedia({ video: text.trim() || undefined })}
					placeholder="https://drive.google.com/file/d/…"
				/>
				{draft.media.video && driveFileId(draft.media.video) ? (
					<DrivePlayer link={draft.media.video} height={200} />
				) : null}
			</Card>
			{notice ? (
				<PoText variant="meta13" tone="textDanger">
					{notice}
				</PoText>
			) : null}
			<Footer>
				{id && (isOwn || data.savedExercises.some((item) => item.id === id)) ? (
					<PillButton
						label={isOwn ? "Delete" : "Reset"}
						variant="secondary"
						style={styles.flex}
						onPress={remove}
					/>
				) : null}
				<PillButton
					label={saving ? "Saving…" : "Save"}
					disabled={saving || uploading !== null}
					style={styles.flex}
					onPress={() => void save()}
				/>
			</Footer>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	section: { gap: 2, marginTop: 4 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	media: { gap: 8 },
	mediaHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
