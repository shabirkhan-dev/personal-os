import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddEntryModal } from "@/components/ui/add-entry-modal";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { OSHeader } from "@/components/ui/os-header";
import { LibraryWidget } from "@/components/widgets/library-widget";
import { useTheme } from "@/providers/theme-provider";
import { useAppStore } from "@/store/use-app-store";

export default function LibraryIndex() {
	const [modalVisible, setModalVisible] = useState(false);
	const { colors } = useTheme();
	const addEntry = useAppStore((state) => state.addEntry);

	const handleSave = (title: string, subtitle: string, value: string, delta: string) => {
		addEntry("library", { title, subtitle, value, delta });
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
							<Text className="text-foreground text-3xl font-light tracking-tight">Library</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Reading lists, knowledge base, and notes.
							</Text>
						</View>
						<LibraryWidget />
					</View>
				</ScrollView>
			</SafeAreaView>

			<FloatingActionButton color={colors.accent.teal} onPress={() => setModalVisible(true)} />

			<AddEntryModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				onSave={handleSave}
				color={colors.accent.teal}
				titleLabel="Add Book/Note"
			/>
		</View>
	);
}
