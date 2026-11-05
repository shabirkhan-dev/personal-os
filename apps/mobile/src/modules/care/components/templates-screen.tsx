import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ScreenTitle } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { CARE_TEMPLATES, type CareTemplate } from "../lib/care-templates";
import { CareScreen } from "./care-screen";
import { PlanPreview } from "./plan-preview";

/** Ready-made starting points. Nothing here is added until the person picks one. */
export function TemplatesScreen() {
	const { colors } = usePoTheme();
	const [open, setOpen] = useState<CareTemplate | null>(null);
	const plan = useMemo(() => open?.plan() ?? null, [open]);

	if (open && plan) {
		return (
			<CareScreen ask={false}>
				<Pressable accessibilityRole="button" onPress={() => setOpen(null)} style={styles.back}>
					<PoText variant="meta13" tone="textLink">
						All templates
					</PoText>
				</Pressable>
				<ScreenTitle eyebrow="Template" title={open.title} />
				<PlanPreview plan={plan} note={open.description} />
			</CareScreen>
		);
	}

	return (
		<CareScreen>
			<ScreenTitle eyebrow="Optional · nothing is added until you pick one" title="Templates" />
			{CARE_TEMPLATES.map((template) => {
				const preview = template.plan();
				const counts = [
					preview.steps.length ? `${preview.steps.length} steps` : "",
					preview.habits.length ? `${preview.habits.length} habits` : "",
					preview.areas.length ? `${preview.areas.length} areas` : "",
					preview.products.length ? `${preview.products.length} products` : "",
				]
					.filter(Boolean)
					.join(" · ");
				return (
					<Pressable
						key={template.id}
						accessibilityRole="button"
						onPress={() => {
							haptics.tap();
							setOpen(template);
						}}
						style={({ pressed }) => [
							styles.card,
							{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
						]}
					>
						<View style={styles.flex}>
							<PoText variant="row15">{template.title}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{template.description}
							</PoText>
							<PoText variant="meta13" tone="textTertiary">
								{counts}
							</PoText>
						</View>
						<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
					</Pressable>
				);
			})}
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, gap: 4, minWidth: 0 },
	card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
	back: { alignSelf: "flex-start", paddingHorizontal: 4 },
});
