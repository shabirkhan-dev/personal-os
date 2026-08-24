import {
	Activity01Icon,
	AppleIcon,
	Bookmark01Icon,
	BookOpen01Icon,
	Brain01Icon,
	Calendar01Icon,
	CreditCardIcon,
	Dumbbell01Icon,
	Home01Icon,
	LibraryIcon,
	Menu01Icon,
	PieChartIcon,
	PlusSignIcon,
	Shield01Icon,
	ShoppingBag01Icon,
	SparklesIcon,
	Target01Icon,
	Task01Icon,
	UserIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { router, usePathname, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconProp } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface TabItemConfig {
	id: string;
	label: string;
	icon: IconProp;
	route: string;
}

export const GLOBAL_TABS: TabItemConfig[] = [
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		route: "/(modules)/(dashboard)",
	},
	{
		id: "routines",
		label: "Routines",
		icon: Calendar01Icon,
		route: "/(modules)/(routines)",
	},
	{
		id: "finance",
		label: "Finance",
		icon: Wallet01Icon,
		route: "/(modules)/(expenses)",
	},
	{
		id: "profile",
		label: "Profile",
		icon: UserIcon,
		route: "/(modules)/(profile)",
	},
];

export const FINANCE_TABS: TabItemConfig[] = [
	{
		id: "capital",
		label: "Capital",
		icon: Wallet01Icon,
		route: "/(modules)/(expenses)",
	},
	{
		id: "transactions",
		label: "Logs",
		icon: Menu01Icon,
		route: "/(modules)/(expenses)/transactions",
	},
	{
		id: "budgets",
		label: "Budgets",
		icon: PieChartIcon,
		route: "/(modules)/(expenses)/budget",
	},
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		route: "/(modules)/(dashboard)",
	},
];

export const ROUTINES_TABS: TabItemConfig[] = [
	{
		id: "today",
		label: "Today",
		icon: Calendar01Icon,
		route: "/(modules)/(routines)",
	},
	{
		id: "habits",
		label: "Habits",
		icon: Menu01Icon,
		route: "/(modules)/(routines)/habits",
	},
	{
		id: "finance",
		label: "Finance",
		icon: Wallet01Icon,
		route: "/(modules)/(expenses)",
	},
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		route: "/(modules)/(dashboard)",
	},
];

export const PROFILE_TABS: TabItemConfig[] = [
	{
		id: "profile",
		label: "Profile",
		icon: UserIcon,
		route: "/(modules)/(profile)",
	},
	{
		id: "security",
		label: "Security",
		icon: Shield01Icon,
		route: "/(modules)/(profile)/security",
	},
	{
		id: "billing",
		label: "Billing",
		icon: CreditCardIcon,
		route: "/(modules)/(profile)/billing",
	},
	{
		id: "home",
		label: "Home",
		icon: Home01Icon,
		route: "/(modules)/(dashboard)",
	},
];

export const SKINCARE_TABS: TabItemConfig[] = [
	{ id: "routine", label: "Routine", icon: SparklesIcon, route: "/(modules)/(skincare)" },
	{
		id: "products",
		label: "Products",
		icon: ShoppingBag01Icon,
		route: "/(modules)/(skincare)/products",
	},
	{ id: "history", label: "History", icon: Calendar01Icon, route: "/(modules)/(skincare)/history" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export const NUTRITION_TABS: TabItemConfig[] = [
	{ id: "diet", label: "Diet", icon: PieChartIcon, route: "/(modules)/(nutrition)" },
	{ id: "meals", label: "Meals", icon: AppleIcon, route: "/(modules)/(nutrition)/meals" },
	{ id: "finance", label: "Finance", icon: Wallet01Icon, route: "/(modules)/(expenses)" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export const MINDFULNESS_TABS: TabItemConfig[] = [
	{ id: "clarity", label: "Clarity", icon: Brain01Icon, route: "/(modules)/(mindfulness)" },
	{
		id: "journal",
		label: "Journal",
		icon: BookOpen01Icon,
		route: "/(modules)/(mindfulness)/journal",
	},
	{ id: "routines", label: "Routines", icon: Calendar01Icon, route: "/(modules)/(routines)" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export const LIBRARY_TABS: TabItemConfig[] = [
	{ id: "library", label: "Library", icon: LibraryIcon, route: "/(modules)/(library)" },
	{ id: "books", label: "Books", icon: Bookmark01Icon, route: "/(modules)/(library)/books" },
	{ id: "routines", label: "Routines", icon: Calendar01Icon, route: "/(modules)/(routines)" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export const FOCUS_TABS: TabItemConfig[] = [
	{ id: "focus", label: "Focus", icon: Target01Icon, route: "/(modules)/(focus)" },
	{ id: "tasks", label: "Tasks", icon: Task01Icon, route: "/(modules)/(focus)/tasks" },
	{ id: "routines", label: "Routines", icon: Calendar01Icon, route: "/(modules)/(routines)" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export const EXERCISE_TABS: TabItemConfig[] = [
	{ id: "performance", label: "Performance", icon: Dumbbell01Icon, route: "/(modules)/(exercise)" },
	{ id: "records", label: "Records", icon: Activity01Icon, route: "/(modules)/(exercise)/records" },
	{ id: "routines", label: "Routines", icon: Calendar01Icon, route: "/(modules)/(routines)" },
	{ id: "home", label: "Home", icon: Home01Icon, route: "/(modules)/(dashboard)" },
];

export interface BottomNavProps {
	tabs?: TabItemConfig[];
	activeTab?: string;
	onAddPress?: () => void;
	addIcon?: IconProp;
	addAccessibilityLabel?: string;
}

export function BottomNav({
	tabs = GLOBAL_TABS,
	activeTab,
	onAddPress,
	addIcon = PlusSignIcon,
	addAccessibilityLabel = "Quick action",
}: BottomNavProps) {
	const insets = useSafeAreaInsets();
	const pathname = usePathname();
	const segments = useSegments() as string[];

	const isRouteMatch = (route: string) => {
		const routeSegments = route.split("/").filter(Boolean);
		const segmentMatch = routeSegments.every((segment, index) => segments[index] === segment);
		return segmentMatch || pathname === route || pathname.startsWith(`${route}/`);
	};

	const getActiveTabId = (): string => {
		if (activeTab) return activeTab;
		const match = [...tabs]
			.sort((a, b) => b.route.length - a.route.length)
			.find((t) => isRouteMatch(t.route));
		if (match) return match.id;
		return tabs[0]?.id ?? "home";
	};

	const currentActive = getActiveTabId();

	const handleTabPress = (tab: TabItemConfig) => {
		if (currentActive !== tab.id) {
			router.replace(tab.route as never);
		}
	};

	const leftTabs = tabs.slice(0, 2);
	const rightTabs = tabs.slice(2, 4);

	return (
		<View
			style={{ paddingBottom: Math.max(insets.bottom, 12) }}
			className="bg-card border-t border-border flex-row items-center justify-around px-2 pt-2 shadow-sm"
		>
			{/* Left 2 Tabs */}
			{leftTabs.map((tab) => {
				const isActive = currentActive === tab.id;
				return (
					<Pressable
						key={tab.id}
						onPress={() => handleTabPress(tab)}
						className="flex-1 items-center justify-center py-1 active:opacity-70"
						accessibilityRole="button"
						accessibilityLabel={tab.label}
						accessibilityState={{ selected: isActive }}
					>
						<Icon
							icon={tab.icon}
							size={22}
							className={isActive ? "text-foreground" : "text-muted-foreground"}
							strokeWidth={isActive ? 2.2 : 1.6}
						/>
						<Text
							className={cn(
								"text-[10px] mt-1 tracking-tight",
								isActive ? "text-foreground font-semibold" : "text-muted-foreground font-normal",
							)}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}

			{onAddPress ? (
				<View className="items-center justify-center px-1">
					<Pressable
						onPress={onAddPress}
						className="w-[52px] h-[34px] rounded-full bg-foreground items-center justify-center shadow-lg active:scale-95"
						accessibilityRole="button"
						accessibilityLabel={addAccessibilityLabel}
					>
						<Icon icon={addIcon} size={20} className="text-background" strokeWidth={2.4} />
					</Pressable>
				</View>
			) : null}

			{/* Right 2 Tabs */}
			{rightTabs.map((tab) => {
				const isActive = currentActive === tab.id;
				return (
					<Pressable
						key={tab.id}
						onPress={() => handleTabPress(tab)}
						className="flex-1 items-center justify-center py-1 active:opacity-70"
						accessibilityRole="button"
						accessibilityLabel={tab.label}
						accessibilityState={{ selected: isActive }}
					>
						<Icon
							icon={tab.icon}
							size={22}
							className={isActive ? "text-foreground" : "text-muted-foreground"}
							strokeWidth={isActive ? 2.2 : 1.6}
						/>
						<Text
							className={cn(
								"text-[10px] mt-1 tracking-tight",
								isActive ? "text-foreground font-semibold" : "text-muted-foreground font-normal",
							)}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
