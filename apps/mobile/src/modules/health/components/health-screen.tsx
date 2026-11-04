import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { healthRoutes } from "../navigation";

export type HealthScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Health screen: the shared module shell with the Health pill and Insights. */
export function HealthScreen({ insightsActive = false, ...props }: HealthScreenProps) {
	return (
		<ModuleScreen
			label="Health"
			onHome={healthRoutes.today}
			insights={{ onPress: healthRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
