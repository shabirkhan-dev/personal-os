import { Book01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddEntryModal } from "@/components/ui/add-entry-modal";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { useTheme } from "@/providers/theme-provider";
import { useAppStore } from "@/store/use-app-store";

export default function MindfulnessJournalScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const { colors } = useTheme();
	const journal = useAppStore((state) => state.mindfulnessJournal);
	const addEntry = useAppStore((state) => state.addEntry);
	const deleteEntry = useAppStore((state) => state.deleteEntry);

	const handleSave = (title: string, subtitle: string, value: string, delta: string) => {
		addEntry("mindfulness", { title, subtitle, value, delta });
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
							<Text className="text-foreground text-3xl font-light tracking-tight">Journal</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Daily thoughts, gratitudes, and reflections.
							</Text>
						</View>

						<View className="mt-3">
							{journal.length === 0 ? (
								<Text className="text-muted-foreground text-base text-center mt-8">
									No journal entries yet.
								</Text>
							) : (
								journal.map((item) => (
									<LogListItem
										key={item.id}
										icon={Book01Icon}
										iconColor={colors.accent.cyan}
										title={item.title}
										subtitle={item.subtitle}
										value={item.value}
										delta={item.delta}
										deltaColor={colors.accent.green}
										onPress={() => deleteEntry("mindfulness", item.id)}
									/>
								))
							)}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<FloatingActionButton color={colors.accent.cyan} onPress={() => setModalVisible(true)} />

			<AddEntryModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				onSave={handleSave}
				color={colors.accent.cyan}
				titleLabel="Add Journal Entry"
			/>
		</View>
	);
}
