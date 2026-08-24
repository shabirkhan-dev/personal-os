import {
	ArrowDown01Icon,
	Moon02Icon,
	Notification01Icon,
	Sun01Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { type Href, router, useSegments } from "expo-router";
import * as React from "react";
import { Alert, Image, Modal, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth";
import { useTheme } from "@/providers/theme-provider";

export type OSModule = "Dashboard" | "Routines" | "Finance" | "Profile";

export function OSHeader() {
	const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
	const segments = useSegments() as string[];
	const { user } = useAuth();
	const { isDark, toggleTheme } = useTheme();

	const avatarUri =
		resolveMediaUrl(user?.profile?.avatarUrl?.trim()) ||
		(user
			? `https://avatar.vercel.sh/${encodeURIComponent(user.username)}`
			: "https://avatar.vercel.sh/guest");

	const handleAvatarPress = () => {
		router.replace("/(modules)/(profile)" as Href);
	};

	const currentModule: OSModule = React.useMemo(() => {
		if (segments.includes("(profile)")) return "Profile";
		if (segments.includes("(routines)")) return "Routines";
		if (segments.includes("(expenses)")) return "Finance";
		return "Dashboard";
	}, [segments]);

	const modules: { label: OSModule; route: Href }[] = [
		{ label: "Dashboard", route: "/(modules)/(dashboard)" },
		{ label: "Routines", route: "/(modules)/(routines)" },
		{ label: "Finance", route: "/(modules)/(expenses)" },
		{ label: "Profile", route: "/(modules)/(profile)" as Href },
	];

	const handleSelect = (route: Href) => {
		router.replace(route);
		setIsDropdownOpen(false);
	};

	return (
		<View className="flex-row items-center justify-between px-4 py-3 bg-background border-b border-border/80">
			<View className="flex-row items-center gap-3">
				<Pressable className="relative" onPress={handleAvatarPress}>
					<Image
						source={{ uri: avatarUri }}
						className="w-9 h-9 rounded-full bg-card border border-border"
					/>
					<View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background" />
				</Pressable>

				<View className="relative">
					<Pressable
						className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-full bg-card border border-border"
						onPress={() => setIsDropdownOpen(true)}
					>
						<Text className="text-foreground text-xs font-bold tracking-tight">
							{currentModule}
						</Text>
						<Icon icon={ArrowDown01Icon} size={14} className="text-muted-foreground" />
					</Pressable>

					<Modal
						visible={isDropdownOpen}
						transparent={true}
						animationType="fade"
						onRequestClose={() => setIsDropdownOpen(false)}
					>
						<TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
							<View className="flex-1 bg-black/60 justify-start pt-16 px-4">
								<TouchableWithoutFeedback>
									<View className="bg-card border border-border rounded-2xl p-2 shadow-2xl w-48 ml-10">
										<Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1.5">
											Switch Module
										</Text>
										{modules.map((item) => {
											const isSelected = item.label === currentModule;
											return (
												<Pressable
													key={item.label}
													className={cn(
														"flex-row items-center justify-between py-2.5 px-3 rounded-xl",
														isSelected ? "bg-primary/10" : "active:bg-muted/40",
													)}
													onPress={() => handleSelect(item.route)}
												>
													<Text
														className={cn(
															"text-xs font-semibold",
															isSelected ? "text-primary font-bold" : "text-foreground",
														)}
													>
														{item.label}
													</Text>
													{isSelected ? (
														<Icon icon={Tick01Icon} size={14} className="text-primary" />
													) : null}
												</Pressable>
											);
										})}
									</View>
								</TouchableWithoutFeedback>
							</View>
						</TouchableWithoutFeedback>
					</Modal>
				</View>
			</View>

			<View className="flex-row items-center gap-2">
				{/* Theme Toggle Button */}
				<Pressable
					onPress={toggleTheme}
					className="w-9 h-9 rounded-full bg-card border border-border items-center justify-center active:opacity-80 shadow-sm"
					accessibilityLabel="Toggle theme"
				>
					<Icon
						icon={isDark ? Sun01Icon : Moon02Icon}
						size={16}
						className={isDark ? "text-amber-400" : "text-foreground"}
					/>
				</Pressable>

				{/* Notifications Bell */}
				<Pressable
					className="w-9 h-9 rounded-full bg-card border border-border items-center justify-center relative active:opacity-80 shadow-sm"
					onPress={() => Alert.alert("Notifications", "You are all caught up.")}
					accessibilityLabel="Notifications"
				>
					<Icon icon={Notification01Icon} size={18} className="text-foreground" />
					<View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
				</Pressable>
			</View>
		</View>
	);
}
