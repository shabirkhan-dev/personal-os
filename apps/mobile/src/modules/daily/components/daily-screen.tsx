import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { dailyRoutes } from "../navigation";

export type DailyScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner Daily life screen: the shared module shell with the Daily life pill and Insights. */
export function DailyScreen({ insightsActive = false, ...props }: DailyScreenProps) {
	return (
		<ModuleScreen
			label="Daily life"
			onHome={dailyRoutes.today}
			insights={{ onPress: dailyRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
