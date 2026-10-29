import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { careerRoutes } from "../navigation";

export type CareerScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "assistant"> & {
	/** What the assistant should know is on screen: the screen's name and its record. */
	about?: { screen: string; recordId?: string };
};

/** An inner Career screen: the shared module shell with the Career pill and the Ask button. */
export function CareerScreen({ about, ...props }: CareerScreenProps) {
	return (
		<ModuleScreen
			label="Career"
			onHome={careerRoutes.today}
			assistant={{
				module: "career",
				screen: about?.screen ?? "career",
				...(about?.recordId ? { recordId: about.recordId } : {}),
			}}
			{...props}
		/>
	);
}
