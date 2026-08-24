import { router } from "expo-router";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AccountTab = "profile" | "security" | "billing";

interface AccountTabsProps {
	active: AccountTab;
}

export function AccountTabs({ active }: AccountTabsProps) {
	return (
		<TabsList>
			<TabsTrigger
				label="Profile"
				active={active === "profile"}
				onPress={() => router.replace("/(modules)/(profile)")}
			/>
			<TabsTrigger
				label="Security"
				active={active === "security"}
				onPress={() => router.replace("/(modules)/(profile)/security")}
			/>
			<TabsTrigger
				label="Billing"
				active={active === "billing"}
				onPress={() => router.replace("/(modules)/(profile)/billing")}
			/>
		</TabsList>
	);
}
