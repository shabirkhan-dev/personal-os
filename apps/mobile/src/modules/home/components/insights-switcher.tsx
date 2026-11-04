import { router, usePathname } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { create } from "zustand";
import { FilterChip } from "@/components/module-ui";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { insightsAreaFor, insightsAreas, insightsTarget } from "../lib/insights-routes";

/** The last module whose Insights was open, so the tab comes back to it. Not saved. */
const useLastInsights = create<{ last: ModuleId | null }>(() => ({ last: null }));

/** The Insights tab from a screen without its own Insights; null when no module has one. */
export function insightsTabPress(): (() => void) | undefined {
	const { modules } = useOnboardingStore.getState();
	const target = insightsTarget(modules, useLastInsights.getState().last);
	return target ? () => router.push(target) : undefined;
}

/**
 * One Insights for the whole app: a row of the person's modules above each module's Insights,
 * switching in place so Back still leaves Insights.
 */
export function InsightsSwitcher() {
	const pathname = usePathname();
	const modules = useOnboardingStore((state) => state.modules);
	const current = insightsAreaFor(pathname);
	const areas = insightsAreas(modules);

	useEffect(() => {
		if (current) useLastInsights.setState({ last: current });
	}, [current]);

	if (areas.length < 2) return null;
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			accessibilityRole="radiogroup"
			accessibilityLabel="Insights for"
			style={styles.row}
			contentContainerStyle={styles.chips}
		>
			{areas.map((area) => (
				<FilterChip
					key={area.id}
					label={area.label}
					selected={area.id === current}
					onPress={() => {
						if (area.id !== current) router.replace(area.route);
					}}
				/>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	row: { marginHorizontal: -16, flexGrow: 0 },
	chips: { gap: 8, paddingHorizontal: 16 },
});
