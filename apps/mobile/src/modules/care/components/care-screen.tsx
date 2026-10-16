import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { careRoutes } from "../navigation";

export type CareScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Care screen: the shared module shell with the Care pill and the Insights tab. */
export function CareScreen({ insightsActive = false, ...props }: CareScreenProps) {
	return (
		<ModuleScreen
			label="Care"
			onHome={careRoutes.today}
			insights={{ onPress: careRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
