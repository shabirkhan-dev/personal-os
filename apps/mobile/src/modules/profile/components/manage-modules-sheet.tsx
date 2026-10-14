import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { type ModuleId, moduleOptions } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { modulesOnLabel } from "../lib/labels";

type ManageModulesSheetProps = { visible: boolean; onClose: () => void };

/** Every module with an on/off switch; changes are saved with the onboarding answers. */
export function ManageModulesSheet({ visible, onClose }: ManageModulesSheetProps) {
	const { colors } = usePoTheme();
	const modules = useOnboardingStore((state) => state.modules);
	const toggleModule = useOnboardingStore((state) => state.toggleModule);

	const toggle = (id: ModuleId) => {
		toggleModule(id);
		useOnboardingProgress
			.getState()
			.persistAnswers()
			.catch((error: unknown) => console.error("Could not save modules", error));
	};

	return (
		<Sheet visible={visible} title="Manage modules" onClose={onClose}>
			<PoText variant="meta13" tone="textSecondary">
				{`${modulesOnLabel(modules.length)}. Turned-off modules keep what you logged.`}
			</PoText>
			{moduleOptions.map((option) => {
				const on = modules.includes(option.id);
				return (
					<View key={option.id} style={styles.row}>
						<View style={[styles.tile, { backgroundColor: colors[option.tileTone] }]}>
							<Icon name={option.icon} color={colors[option.iconTone]} />
						</View>
						<View style={styles.text}>
							<PoText variant="row15">{option.label}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{option.summary}
							</PoText>
						</View>
						<Toggle
							value={on}
							onChange={() => toggle(option.id)}
							accessibilityLabel={`${option.label} module`}
						/>
					</View>
				);
			})}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	tile: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, gap: 2 },
});
