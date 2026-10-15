import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { faithRoutes } from "../navigation";

export type FaithScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	/** True on the Insights screen itself. */
	insightsActive?: boolean;
};

/** An inner Faith screen: the shared module shell with the Faith pill and the Insights tab. */
export function FaithScreen({ insightsActive = false, ...props }: FaithScreenProps) {
	return (
		<ModuleScreen
			label="Faith"
			onHome={faithRoutes.today}
			insights={{ onPress: faithRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
