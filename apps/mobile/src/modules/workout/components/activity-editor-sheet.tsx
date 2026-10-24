import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { deleteActivity, saveActivity } from "../data/training-actions";
import {
	ACTIVITY_PRESETS,
	type Activity,
	type ActivityMetric,
	type ActivityPreset,
	newMetric,
} from "../lib/activities";
import { SPORT_LABELS, SPORTS, type Sport } from "../lib/training-model";

const KINDS: readonly Sport[] = SPORTS;
const MINUTES = [20, 30, 45, 60, 75, 90, 120] as const;

type Draft = Omit<Activity, "id" | "createdAt">;

const blank: Draft = {
	name: "",
	kind: "other",
	minutes: 60,
	distance: false,
	metrics: [],
	photo: "handstand",
};

/**
 * Add or edit an activity: start from a preset or from nothing, then the name, its category (for
 * calories and colour), usual length, whether it has a distance, and up to six numbers to track.
 */
export function ActivityEditorSheet({
	visible,
	activity,
	existing,
	onClose,
}: {
	visible: boolean;
	/** The activity being edited; null to add one. */
	activity: Activity | null;
	existing: readonly Activity[];
	onClose: () => void;
}) {
	const { colors } = usePoTheme();
	const [draft, setDraft] = useState<Draft>(blank);
	const [label, setLabel] = useState("");
	const [unit, setUnit] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Fresh each time it opens.
	useEffect(() => {
		if (!visible) return;
		setDraft(activity ? { ...activity, metrics: [...activity.metrics] } : blank);
		setLabel("");
		setUnit("");
		setNotice(null);
		// oxlint-disable-next-line react/exhaustive-deps -- resets when the sheet opens
	}, [visible]);

	const applyPreset = (preset: ActivityPreset) => {
		haptics.select();
		setDraft({ ...preset, metrics: [...preset.metrics] });
	};

	const addMetric = () => {
		if (!label.trim()) return;
		const metric = newMetric(label, unit);
		if (draft.metrics.some((item) => item.key === metric.key)) {
			setNotice(`${metric.label} is already tracked.`);
			return;
		}
		setDraft((current) => ({ ...current, metrics: [...current.metrics, metric].slice(0, 6) }));
		setLabel("");
		setUnit("");
		setNotice(null);
	};

	const removeMetric = (metric: ActivityMetric) =>
		setDraft((current) => ({
			...current,
			metrics: current.metrics.filter((item) => item.key !== metric.key),
		}));

	const save = async () => {
		const name = draft.name.trim();
		if (name.length < 2) {
			setNotice("Give it a name.");
			return;
		}
		if (
			existing.some(
				(item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== activity?.id,
			)
		) {
			setNotice(`You already have ${name}.`);
			return;
		}
		setSaving(true);
		try {
			await saveActivity({
				...draft,
				name,
				id: activity?.id ?? newId(),
				createdAt: activity?.createdAt ?? new Date().toISOString(),
			});
			haptics.success();
			onClose();
		} catch (error) {
			console.error("[training] could not save the activity", error);
			setNotice("Couldn't save on this phone. Try again.");
		} finally {
			setSaving(false);
		}
	};

	const remove = () => {
		if (!activity) return;
		Alert.alert(
			`Delete ${activity.name}?`,
			"Logged sessions stay. Fixed days using it are cleared next week.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						deleteActivity(activity)
							.then(onClose)
							.catch((error: unknown) => {
								console.error("[training] could not delete the activity", error);
								setNotice("Couldn't save on this phone. Try again.");
							});
					},
				},
			],
		);
	};

	return (
		<Sheet
			visible={visible}
			title={activity ? `Edit ${activity.name}` : "Add an activity"}
			onClose={onClose}
			footer={
				<View style={styles.footer}>
					{activity ? (
						<PillButton label="Delete" variant="secondary" style={styles.flex} onPress={remove} />
					) : null}
					<PillButton
						label={saving ? "Saving…" : "Save"}
						disabled={saving}
						style={styles.flex}
						onPress={() => void save()}
					/>
				</View>
			}
		>
			<View style={styles.body}>
				{!activity ? (
					<>
						<PoText variant="meta13" tone="textSecondary">
							Start from one of these, or fill it in yourself.
						</PoText>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.row}
						>
							{ACTIVITY_PRESETS.filter(
								(preset) => !existing.some((item) => item.name === preset.name),
							).map((preset) => (
								<FilterChip
									key={preset.name}
									label={preset.name}
									selected={draft.name === preset.name}
									onPress={() => applyPreset(preset)}
								/>
							))}
						</ScrollView>
					</>
				) : null}
				<TextField
					label="Name"
					value={draft.name}
					onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
					placeholder="Futsal, swimming, padel…"
				/>
				<PoText variant="row15">Category</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Used for calories and colour.
				</PoText>
				<View style={styles.wrap}>
					{KINDS.map((kind) => (
						<FilterChip
							key={kind}
							label={SPORT_LABELS[kind]}
							selected={draft.kind === kind}
							onPress={() => setDraft((current) => ({ ...current, kind }))}
						/>
					))}
				</View>
				<PoText variant="row15">Usual length</PoText>
				<View style={styles.wrap}>
					{MINUTES.map((minutes) => (
						<FilterChip
							key={minutes}
							label={`${minutes} min`}
							selected={draft.minutes === minutes}
							onPress={() => setDraft((current) => ({ ...current, minutes }))}
						/>
					))}
				</View>
				<View style={styles.wrap}>
					<FilterChip
						label="Has a distance"
						selected={draft.distance}
						onPress={() => setDraft((current) => ({ ...current, distance: !current.distance }))}
					/>
				</View>
				<PoText variant="row15">What to track</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Numbers you fill in each time: goals, laps, points, routes.
				</PoText>
				{draft.metrics.map((metric) => (
					<View key={metric.key} style={styles.metric}>
						<PoText variant="body15" style={styles.flex}>
							{metric.unit ? `${metric.label} (${metric.unit})` : metric.label}
						</PoText>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={`Stop tracking ${metric.label}`}
							hitSlop={8}
							onPress={() => removeMetric(metric)}
						>
							<Icon name="Line/Close" size={16} color={colors.textSecondary} />
						</Pressable>
					</View>
				))}
				{draft.metrics.length < 6 ? (
					<View style={styles.add}>
						<View style={styles.flex}>
							<TextField label="Number" value={label} onChangeText={setLabel} placeholder="Goals" />
						</View>
						<View style={styles.unit}>
							<TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="m" />
						</View>
					</View>
				) : null}
				{draft.metrics.length < 6 ? (
					<PillButton
						label="Track this number"
						variant="ghost"
						showPlus
						disabled={!label.trim()}
						onPress={addMetric}
					/>
				) : null}
				{notice ? (
					<PoText variant="meta13" tone="textDanger">
						{notice}
					</PoText>
				) : null}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	body: { gap: 10, paddingBottom: 8 },
	row: { gap: 8, paddingVertical: 2 },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	metric: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
	add: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
	unit: { width: 90 },
	footer: { flexDirection: "row", gap: 10 },
});
