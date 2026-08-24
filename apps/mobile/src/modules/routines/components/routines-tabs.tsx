import { router } from "expo-router";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type RoutineTab = "today" | "habits";

interface RoutinesTabsProps {
	active: RoutineTab;
}

const TABS: Array<{ id: RoutineTab; label: string; route: string }> = [
	{ id: "today", label: "Today", route: "/(modules)/(routines)" },
	{ id: "habits", label: "All Routines", route: "/(modules)/(routines)/habits" },
];

export function RoutinesTabs({ active }: RoutinesTabsProps) {
	return (
		<TabsList>
			{TABS.map((tab) => {
				const isSelected = active === tab.id;
				return (
					<TabsTrigger
						key={tab.id}
						label={tab.label}
						active={isSelected}
						onPress={() => {
							if (!isSelected) {
								router.push(tab.route as never);
							}
						}}
					/>
				);
			})}
		</TabsList>
	);
}
