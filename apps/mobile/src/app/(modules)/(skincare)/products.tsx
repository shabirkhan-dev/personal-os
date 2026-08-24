import { DropletIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddEntryModal } from "@/components/ui/add-entry-modal";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { useTheme } from "@/providers/theme-provider";
import { useAppStore } from "@/store/use-app-store";

export default function ProductsScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const { colors } = useTheme();
	const products = useAppStore((state) => state.skincareProducts);
	const addEntry = useAppStore((state) => state.addEntry);
	const deleteEntry = useAppStore((state) => state.deleteEntry);

	const handleSave = (title: string, subtitle: string, value: string, delta: string) => {
		addEntry("skincare", { title, subtitle, value, delta });
	};

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View className="px-4 pt-2">
						<View className="mb-6">
							<Text className="text-foreground text-3xl font-light tracking-tight">Products</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Your skincare inventory and product ratings.
							</Text>
						</View>

						<View className="mt-3">
							{products.length === 0 ? (
								<Text className="text-muted-foreground text-sm text-center mt-4">
									No products added yet.
								</Text>
							) : (
								products.map((item) => (
									<LogListItem
										key={item.id}
										icon={DropletIcon}
										iconColor={colors.accent.blue}
										title={item.title}
										subtitle={item.subtitle}
										value={item.value}
										delta={item.delta}
										deltaColor={colors.accent.green}
										onPress={() => deleteEntry("skincare", item.id)}
									/>
								))
							)}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<FloatingActionButton color={colors.accent.purple} onPress={() => setModalVisible(true)} />

			<AddEntryModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				onSave={handleSave}
				color={colors.accent.purple}
				titleLabel="Add Skincare Product"
			/>
		</View>
	);
}
