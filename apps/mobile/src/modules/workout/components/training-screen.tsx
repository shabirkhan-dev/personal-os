import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { trainingRoutes } from "../navigation";

export type TrainingScreenProps = Omit<
	ModuleScreenProps,
	"label" | "onHome" | "insights" | "assistant"
> & {
	insightsActive?: boolean;
	/** False during a live session or rounds, where the Ask button would cover the controls. */
	ask?: boolean;
};

/** An inner Training screen: the shared module shell with the Training pill, Insights and Ask. */
export function TrainingScreen({
	insightsActive = false,
	ask = true,
	...props
}: TrainingScreenProps) {
	return (
		<ModuleScreen
			label="Training"
			onHome={trainingRoutes.today}
			insights={{ onPress: trainingRoutes.insights, active: insightsActive }}
			{...(ask ? { assistant: { module: "workout", screen: "training" } } : {})}
			{...props}
		/>
	);
}
