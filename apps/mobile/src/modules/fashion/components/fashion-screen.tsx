import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { fashionRoutes } from "../navigation";

export type FashionScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Fashion screen: the shared module shell with the Fashion pill and the Insights tab. */
export function FashionScreen({ insightsActive = false, ...props }: FashionScreenProps) {
	return (
		<ModuleScreen
			label="Fashion"
			onHome={fashionRoutes.today}
			insights={{ onPress: fashionRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
