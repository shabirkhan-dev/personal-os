import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { saveSettings } from "../data/daily-actions";
import {
	availableMinimum,
	MINIMUM,
	MODULE_LABELS,
	minimumTitle,
	type Sources,
} from "../lib/daily-math";
import type { DailySettings, MinimumId } from "../lib/daily-model";
import { Card } from "./daily-cards";

/** "Choose your minimum day": 3 to 5 things small enough for the worst day. */
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
	const options = availableMinimum(sources);
	const [picked, setPicked] = useState<MinimumId[]>(() =>
		(settings.setUp
			? settings.minimum
			: settings.minimum.filter((id) => options.includes(id))
		).slice(0, 7),
	);
	const [saving, setSaving] = useState(false);
	const count = picked.length;
	const size =
		count < 3
			? { text: `${count} chosen · pick at least 3`, tone: "textWarning" as const }
			: count > 5
				? { text: `${count} chosen · too many for a bad day`, tone: "textWarning" as const }
				: { text: `${count} chosen · good size`, tone: "textWarning" as const };

	const save = () => {
		setSaving(true);
		const ordered = options.filter((id) => picked.includes(id));
		saveSettings({ ...settings, setUp: true, minimum: ordered })
			.then(() => {
				haptics.success();
				onSaved?.();
			})
			.catch((error: unknown) => console.error("[daily] could not save the minimum day", error))
			.finally(() => setSaving(false));
	};

	return (
		<Card>
			<PoText variant="title18">Choose your minimum day</PoText>
			<PoText variant="body15" tone="textSecondary">
				Pick 3 to 5 things small enough to do even on your worst day. I'll protect them.
			</PoText>
			<View>
				{options.map((id) => {
					const on = picked.includes(id);
					return (
						<Pressable
							key={id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: on }}
							onPress={() => {
								haptics.select();
								setPicked((list) => (on ? list.filter((item) => item !== id) : [...list, id]));
							}}
							style={[styles.row, { borderBottomColor: colors.borderDefault }]}
						>
							<View style={styles.flex}>
								<PoText variant="row15">{minimumTitle(id, sources, settings)}</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{MODULE_LABELS[MINIMUM[id].module]}
								</PoText>
							</View>
							<Checkbox checked={on} />
						</Pressable>
					);
				})}
			</View>
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
	flex: { flex: 1 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
});
