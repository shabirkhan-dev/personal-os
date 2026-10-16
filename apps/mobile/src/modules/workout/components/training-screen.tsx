import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { trainingRoutes } from "../navigation";

export type TrainingScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Training screen: the shared module shell with the Training pill and Insights. */
export function TrainingScreen({ insightsActive = false, ...props }: TrainingScreenProps) {
	return (
		<ModuleScreen
			label="Training"
			onHome={trainingRoutes.today}
			insights={{ onPress: trainingRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
