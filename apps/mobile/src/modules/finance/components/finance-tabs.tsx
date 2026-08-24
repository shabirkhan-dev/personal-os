import { router } from "expo-router";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FinanceTab = "overview" | "transactions" | "budget";

interface FinanceTabsProps {
	active: FinanceTab;
}

const TABS: Array<{ id: FinanceTab; label: string; route: string }> = [
	{ id: "overview", label: "Overview", route: "/(modules)/(expenses)" },
	{ id: "transactions", label: "Transactions", route: "/(modules)/(expenses)/transactions" },
	{ id: "budget", label: "Budgets", route: "/(modules)/(expenses)/budget" },
];

export function FinanceTabs({ active }: FinanceTabsProps) {
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
