import { ModuleScreen, type ModuleScreenProps } from "@/components/module-screen";
import { careerRoutes } from "../navigation";

export type CareerScreenProps = Omit<ModuleScreenProps, "label" | "onHome">;

/** An inner Career screen: the shared module shell with the Career pill. */
export function CareerScreen(props: CareerScreenProps) {
	return <ModuleScreen label="Career" onHome={careerRoutes.today} {...props} />;
}
