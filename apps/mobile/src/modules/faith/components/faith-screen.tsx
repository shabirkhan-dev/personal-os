import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { faithRoutes } from "../navigation";

export type FaithScreenProps = Omit<
	ModuleScreenProps,
	"label" | "onHome" | "insights" | "assistant"
> & {
	/** False where any tap counts (the tasbih), so the Ask button never gets in the way. */
	ask?: boolean;
	/** True on the Insights screen itself. */
	insightsActive?: boolean;
};

/** An inner Faith screen: the shared module shell with the Faith pill and the Insights tab. */
export function FaithScreen({ insightsActive = false, ask = true, ...props }: FaithScreenProps) {
	return (
		<ModuleScreen
			label="Faith"
			onHome={faithRoutes.today}
			insights={{ onPress: faithRoutes.insights, active: insightsActive }}
			{...(ask ? { assistant: { module: "faith", screen: "faith" } } : {})}
			{...props}
		/>
	);
}
