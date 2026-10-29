import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { careRoutes } from "../navigation";

export type CareScreenProps = Omit<
	ModuleScreenProps,
	"label" | "onHome" | "insights" | "assistant"
> & {
	insightsActive?: boolean;
	/** False on the step-by-step routine, where the Ask button would cover its controls. */
	ask?: boolean;
};

/** An inner Care screen: the shared module shell with the Care pill, Insights and Ask. */
export function CareScreen({ insightsActive = false, ask = true, ...props }: CareScreenProps) {
	return (
		<ModuleScreen
			label="Care"
			onHome={careRoutes.today}
			insights={{ onPress: careRoutes.insights, active: insightsActive }}
			{...(ask ? { assistant: { module: "skincare", screen: "care" } } : {})}
			{...props}
		/>
	);
}
