import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { dailyRoutes } from "../navigation";

export type DailyScreenProps = Omit<ModuleScreenProps, "label" | "onHome" | "insights"> & {
	insightsActive?: boolean;
};

/** An inner day screen (plan, close, sleep, brief): the shared module shell back to Today. */
export function DailyScreen({ insightsActive = false, ...props }: DailyScreenProps) {
	return (
		<ModuleScreen
			label="Today"
			onHome={dailyRoutes.today}
			insights={{ onPress: dailyRoutes.insights, active: insightsActive }}
			{...props}
		/>
	);
}
