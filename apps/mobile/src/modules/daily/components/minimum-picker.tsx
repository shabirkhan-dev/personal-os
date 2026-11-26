import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { saveSettings } from "../data/daily-actions";
import {
	availableMinimum,
	MODULE_LABELS,
	minimumModule,
	minimumTitle,
	type Sources,
} from "../lib/daily-math";
import type { DailySettings, MinimumKey, OwnId, OwnItem } from "../lib/daily-model";
import { Card } from "./daily-cards";

const ownId = (): OwnId => `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * "Your minimum day": 3 to 5 things small enough for the worst day. The person writes their own
 * ("Call mum", "10 push-ups"); the ones their modules can track are offered as ideas below.
 */
export function MinimumPicker({
	settings,
	sources,
	onSaved,
}: {
	settings: DailySettings;
	sources: Sources;
	onSaved?: () => void;
}) {
	const { colors } = usePoTheme();
	const ideas = availableMinimum(sources);
	const [own, setOwn] = useState<OwnItem[]>(settings.own);
	const [picked, setPicked] = useState<MinimumKey[]>(() => settings.minimum.slice(0, 7));
	const [draft, setDraft] = useState("");
	const [saving, setSaving] = useState(false);
	const count = picked.length;
	const size =
		count < 3
			? { text: `${count} chosen · pick at least 3`, tone: "textWarning" as const }
			: count > 5
				? { text: `${count} chosen · too many for a bad day`, tone: "textWarning" as const }
				: { text: `${count} chosen · good size`, tone: "textSuccess" as const };

	const toggle = (key: MinimumKey) => {
		haptics.select();
		setPicked((list) =>
			list.includes(key) ? list.filter((item) => item !== key) : [...list, key],
		);
	};

	const addOwn = () => {
		const label = draft.trim().slice(0, 60);
		if (!label) return;
		const item = { id: ownId(), label };
		haptics.tap();
		setOwn((list) => [...list, item].slice(0, 12));
		setPicked((list) => [...list, item.id]);
		setDraft("");
	};

	const save = () => {
		setSaving(true);
		const order: MinimumKey[] = [...own.map((item) => item.id), ...ideas];
		const ordered = order.filter((key) => picked.includes(key));
		saveSettings({ ...settings, setUp: true, minimum: ordered, own })
			.then(() => {
				haptics.success();
				onSaved?.();
			})
			.catch((error: unknown) => console.error("[daily] could not save the minimum day", error))
			.finally(() => setSaving(false));
	};

	const row = (key: MinimumKey, title: string, meta: string) => {
		const on = picked.includes(key);
		return (
			<Pressable
				key={key}
				accessibilityRole="checkbox"
				accessibilityState={{ checked: on }}
				onPress={() => toggle(key)}
				style={[styles.row, { borderBottomColor: colors.borderDefault }]}
			>
				<View style={styles.flex}>
					<PoText variant="row15">{title}</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{meta}
					</PoText>
				</View>
				<Checkbox checked={on} />
			</Pressable>
		);
	};

	return (
		<Card>
			<PoText variant="title18">Your minimum day</PoText>
			<PoText variant="body15" tone="textSecondary">
				3 to 5 things small enough to do even on your worst day. Write your own, or pick from the
				ideas your modules can track for you.
			</PoText>
			<View style={styles.add}>
				<View style={styles.flex}>
					<TextField
						label="Add your own"
						value={draft}
						onChangeText={setDraft}
						placeholder="Call mum, 10 push-ups, walk 15 minutes"
						onSubmitEditing={addOwn}
					/>
				</View>
				<PillButton label="Add" variant="secondary" disabled={!draft.trim()} onPress={addOwn} />
			</View>
			{own.length > 0 ? (
				<View>{own.map((item) => row(item.id, item.label, "Yours · tick it yourself"))}</View>
			) : null}
			{ideas.length > 0 ? (
				<>
					<PoText variant="eyebrow11" tone="textTertiary">
						IDEAS FROM YOUR MODULES
					</PoText>
					<View>
						{ideas.map((id) =>
							row(id, minimumTitle(id, sources, settings), MODULE_LABELS[minimumModule(id)]),
						)}
					</View>
				</>
			) : null}
			<PoText variant="eyebrow11" tone={size.tone}>
				{size.text}
			</PoText>
			<PillButton
				label={saving ? "Saving…" : "Save my minimum day"}
				disabled={saving || count < 1}
				onPress={save}
			/>
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0 },
	add: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
});
