import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { careerRoutes } from "../navigation";

export type CareerScreenProps = Omit<
	ModuleScreenProps,
	"label" | "onHome" | "assistant" | "insights"
> & {
	/** What the assistant should know is on screen: the screen's name and its record. */
	about?: { screen: string; recordId?: string };
	/** True on the Insights screen itself. */
	insightsActive?: boolean;
};

/** An inner Career screen: the shared module shell with the Career pill, Insights and Ask. */
export function CareerScreen({ about, insightsActive = false, ...props }: CareerScreenProps) {
	return (
		<ModuleScreen
			label="Career"
			onHome={careerRoutes.today}
			insights={{ onPress: careerRoutes.insights, active: insightsActive }}
			assistant={{
				module: "career",
				screen: about?.screen ?? "career",
				...(about?.recordId ? { recordId: about.recordId } : {}),
			}}
			{...props}
		/>
	);
}
