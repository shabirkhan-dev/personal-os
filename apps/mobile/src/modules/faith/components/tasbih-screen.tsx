import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FilterChip, Footer, MetaChip, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { usePoTheme } from "@/theme";
import { saveSettings, saveTasbih } from "../data/faith-actions";
import { useFaith } from "../hooks/use-faith";
import { tasbihProgress } from "../lib/faith-math";
import { TASBIH_PHRASES, TASBIH_TARGETS, type TasbihPhrase } from "../lib/faith-model";
import { FaithScreen } from "./faith-screen";

const RING = 260;
const STROKE = 14;
const DOTS = 33;
const FLUSH_MS = 700;

/** Counts kept in memory while tapping, tagged with the day they were made on. */
type DayCounts = { day: string; counts: Record<string, number> };

/**
 * Tasbih: tap the ring to count. Counts are kept in memory while tapping and saved a moment after
 * the last tap, so a fast hand doesn't write to the phone's database on every touch. They belong to
 * the day they were made: past midnight the count starts from the new day's, not yesterday's.
 */
export function TasbihScreen() {
	const { colors } = usePoTheme();
	const data = useFaith();
	const now = useNow();
	const sequence = data.settings.tasbih;
	const [counts, setCounts] = useState<DayCounts | null>(null);
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [editing, setEditing] = useState(false);
	const countsOn = (day: string): Record<string, number> =>
		counts?.day === day
			? counts.counts
			: (data.tasbihDays.find((item) => item.id === day)?.counts ?? {});
	const live = countsOn(dayKey(now));

	// Phrases outside the sequence can be counted on their own, at 33.
	const all = useMemo<TasbihPhrase[]>(
		() => [
			...sequence,
			...TASBIH_PHRASES.filter((phrase) => !sequence.some((item) => item.id === phrase.id)),
		],
		[sequence],
	);
	const progress = tasbihProgress(sequence, { id: dayKey(now), counts: live }, selected);
	const phrase =
		(selected ? all.find((item) => item.id === selected) : sequence[progress.index]) ?? all[0];
	const count = phrase ? (live[phrase.id] ?? 0) : 0;
	const target = phrase?.target ?? 33;

	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pending = useRef<DayCounts | null>(null);
	const flush = () => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		const value = pending.current;
		pending.current = null;
		if (value) {
			saveTasbih({ id: value.day, counts: value.counts }).catch((error: unknown) =>
				console.error("[faith] could not save tasbih", error),
			);
		}
	};
	// oxlint-disable-next-line react/exhaustive-deps -- flush on leaving the screen only
	useEffect(() => () => flush(), []);

	const write = (next: DayCounts) => {
		// Taps from before midnight are saved under their own day before the new day starts.
		if (pending.current && pending.current.day !== next.day) flush();
		setCounts(next);
		pending.current = next;
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(flush, FLUSH_MS);
	};

	const tap = () => {
		if (!phrase) return;
		const day = dayKey(new Date());
		const base = countsOn(day);
		const value = (base[phrase.id] ?? 0) + 1;
		write({ day, counts: { ...base, [phrase.id]: value } });
		if (value === target) {
			haptics.success();
			const index = sequence.findIndex((item) => item.id === phrase.id);
			const following = index >= 0 ? sequence[index + 1] : undefined;
			if (following && (base[following.id] ?? 0) < following.target) setSelected(following.id);
		} else haptics.tap();
	};

	const setTarget = (value: number) => {
		if (!phrase) return;
		haptics.select();
		const inSequence = sequence.some((item) => item.id === phrase.id);
		if (!inSequence) return;
		void saveSettings({
			...data.settings,
			tasbih: sequence.map((item) => (item.id === phrase.id ? { ...item, target: value } : item)),
		}).catch((error: unknown) => console.error("[faith] could not save the target", error));
	};

	const reset = () => {
		if (!phrase) return;
		Alert.alert(`Reset ${phrase.label}?`, "Today's count for this phrase goes back to 0.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Reset",
				style: "destructive",
				onPress: () => {
					const day = dayKey(new Date());
					write({ day, counts: { ...countsOn(day), [phrase.id]: 0 } });
				},
			},
		]);
	};

	const share = Math.min(1, count / target);
	const radius = (RING - STROKE) / 2;
	const circumference = 2 * Math.PI * radius;
	const setNumber = Math.min(
		sequence.length,
		progress.setsDone + (progress.setsDone < sequence.length ? 1 : 0),
	);

	return (
		<FaithScreen
			action={{ icon: "Filled/Edit", label: "Edit sequence", onPress: () => setEditing(true) }}
		>
			<ScreenTitle eyebrow="Tasbih · tap anywhere to count" title={phrase?.label ?? "Tasbih"}>
				<MetaChip
					icon="Layers"
					iconTone="statusCaution"
					label={`Set ${setNumber} of ${sequence.length}`}
				/>
				<MetaChip icon="Filled/Check all" label={`${progress.total} today`} />
			</ScreenTitle>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.tabs}
			>
				{all.map((item) => (
					<FilterChip
						key={item.id}
						label={item.label}
						selected={item.id === phrase?.id}
						onPress={() => setSelected(item.id)}
					/>
				))}
			</ScrollView>

			<View style={[styles.targets, { backgroundColor: colors.bgSurface }]}>
				{TASBIH_TARGETS.map((value) => {
					const on = value === target;
					return (
						<Pressable
							key={value}
							accessibilityRole="radio"
							accessibilityState={{ selected: on }}
							onPress={() => setTarget(value)}
							style={[styles.target, on ? { backgroundColor: colors.bgHover } : null]}
						>
							<PoText variant="text14" tone={on ? "textPrimary" : "textSecondary"}>
								{value} times
							</PoText>
						</Pressable>
					);
				})}
			</View>

			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${phrase?.label ?? "Count"}, ${count} of ${target}`}
				accessibilityHint="Tap to count one"
				onPress={tap}
				style={styles.ringArea}
			>
				<Svg width={RING + 44} height={RING + 44}>
					{Array.from({ length: DOTS }, (_, step) => step).map((step) => {
						const angle = (step / DOTS) * 2 * Math.PI - Math.PI / 2;
						const r = RING / 2 + 16;
						const lit = step < Math.round(share * DOTS);
						return (
							<Circle
								key={step}
								cx={(RING + 44) / 2 + r * Math.cos(angle)}
								cy={(RING + 44) / 2 + r * Math.sin(angle)}
								r={2.5}
								fill={lit ? colors.accentDefault : colors.borderDefault}
							/>
						);
					})}
					<Circle
						cx={(RING + 44) / 2}
						cy={(RING + 44) / 2}
						r={radius}
						stroke={colors.bgSubtle}
						strokeWidth={STROKE}
						fill="none"
					/>
					<Circle
						cx={(RING + 44) / 2}
						cy={(RING + 44) / 2}
						r={radius}
						stroke={count >= target ? colors.statusSuccess : colors.accentDefault}
						strokeWidth={STROKE}
						strokeLinecap="round"
						fill="none"
						strokeDasharray={`${circumference} ${circumference}`}
						strokeDashoffset={circumference * (1 - share)}
						rotation={-90}
						origin={`${(RING + 44) / 2}, ${(RING + 44) / 2}`}
					/>
				</Svg>
				<View style={styles.ringText} pointerEvents="none">
					<PoText variant="arabic30" tone="textSecondary">
						{phrase?.arabic ?? ""}
					</PoText>
					<PoText variant="hero40">{count}</PoText>
					<PoText variant="mono13" tone="textTertiary">
						of {target}
					</PoText>
				</View>
			</Pressable>

			<SectionLabel>{`Your sequence · ${sequence.length} sets`}</SectionLabel>
			<View
				style={[
					styles.sequence,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				{sequence.map((item, index) => {
					const done = (live[item.id] ?? 0) >= item.target;
					const current = item.id === phrase?.id;
					const tone = done ? "statusSuccessSubtle" : current ? "accentSubtle" : "bgSubtle";
					return (
						<Pressable
							key={item.id}
							accessibilityRole="button"
							onPress={() => setSelected(item.id)}
							style={[styles.step, current ? { backgroundColor: colors.bgHover } : null]}
						>
							<View style={styles.flex}>
								<PoText variant="row15" tone={done || current ? "textPrimary" : "textSecondary"}>
									{item.label}
								</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{done || current
										? `${live[item.id] ?? 0} of ${item.target}`
										: `${item.target} times${index === progress.index + 1 ? " · next" : ""}`}
								</PoText>
							</View>
							<PoText variant="arabic20" tone="textSecondary">
								{item.arabic}
							</PoText>
							<View style={[styles.badge, { backgroundColor: colors[tone] }]}>
								<PoText
									variant="meta13"
									tone={done ? "textSuccess" : current ? "accentDefault" : "textTertiary"}
								>
									{done ? "Done" : current ? "Now" : "Next"}
								</PoText>
							</View>
						</Pressable>
					);
				})}
			</View>

			<Footer>
				<PillButton label="Reset" variant="secondary" onPress={reset} style={styles.flex} />
				<PillButton label="Edit sequence" onPress={() => setEditing(true)} style={styles.flex} />
			</Footer>

			{editing ? (
				<SequenceSheet
					sequence={sequence}
					onClose={() => setEditing(false)}
					onSave={(next) => {
						setEditing(false);
						setSelected(undefined);
						void saveSettings({ ...data.settings, tasbih: next }).catch((error: unknown) =>
							console.error("[faith] could not save the sequence", error),
						);
					}}
				/>
			) : null}
		</FaithScreen>
	);
}

/** Pick the phrases for the sequence, in the order tapped. */
function SequenceSheet({
	sequence,
	onClose,
	onSave,
}: {
	sequence: readonly TasbihPhrase[];
	onClose: () => void;
	onSave: (sequence: TasbihPhrase[]) => void;
}) {
	const [picked, setPicked] = useState<TasbihPhrase[]>([...sequence]);
	const options = [
		...sequence,
		...TASBIH_PHRASES.filter((phrase) => !sequence.some((item) => item.id === phrase.id)),
	];
	return (
		<Sheet
			visible
			title="Edit sequence"
			onClose={onClose}
			action={{ label: "Save", disabled: picked.length === 0, onPress: () => onSave(picked) }}
		>
			<PoText variant="meta13" tone="textSecondary">
				Tap phrases in the order you say them. Tap again to take one out.
			</PoText>
			<View style={styles.options}>
				{options.map((phrase) => {
					const position = picked.findIndex((item) => item.id === phrase.id);
					return (
						<FilterChip
							key={phrase.id}
							label={position >= 0 ? `${position + 1}. ${phrase.label}` : phrase.label}
							selected={position >= 0}
							onPress={() =>
								setPicked((current) =>
									position >= 0
										? current.filter((item) => item.id !== phrase.id)
										: [...current, phrase],
								)
							}
						/>
					);
				})}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	tabs: { gap: 8 },
	targets: { flexDirection: "row", padding: 4, borderRadius: 24 },
	target: { flex: 1, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	ringArea: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
	ringText: { position: "absolute", alignItems: "center", gap: 2 },
	sequence: { borderRadius: 28, borderWidth: 1, padding: 8, gap: 4 },
	step: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20 },
	badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
	options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
