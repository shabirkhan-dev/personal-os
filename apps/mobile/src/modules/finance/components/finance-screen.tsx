import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { financeRoutes } from "../navigation";

export type FinanceScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Finance screen: the shared module shell with the Finance pill and Insights. */
export function FinanceScreen({ insightsActive = false, ...props }: FinanceScreenProps) {
	return (
		<ModuleScreen
			label="Finance"
			onHome={financeRoutes.today}
			insights={{ onPress: financeRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
