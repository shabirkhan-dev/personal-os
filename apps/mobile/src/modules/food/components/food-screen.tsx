import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { foodRoutes } from "../navigation";

export type FoodScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	label?: string;
	insightsActive?: boolean;
};

/** An inner Food screen: the shared module shell with the Food pill and the Insights tab. */
export function FoodScreen({ label = "Food", insightsActive = false, ...props }: FoodScreenProps) {
	return (
		<ModuleScreen
			label={label}
			onHome={foodRoutes.today}
			insights={{ onPress: foodRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
