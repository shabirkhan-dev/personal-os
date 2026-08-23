import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddEntryModal } from "@/components/ui/add-entry-modal";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { LogListItem } from "@/components/ui/log-list-item";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { useAppStore } from "@/store/use-app-store";

export default function LibraryBooksScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const books = useAppStore((state) => state.libraryBooks);
	const addEntry = useAppStore((state) => state.addEntry);
	const deleteEntry = useAppStore((state) => state.deleteEntry);

	const handleSave = (title: string, subtitle: string, value: string, delta: string) => {
		addEntry("library", { title, subtitle, value, delta });
	};

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={styles.viewTitle}>Books</Text>
							<Text style={styles.viewSubtitle}>Your reading list and progress.</Text>
						</View>

						<View style={styles.logsList}>
							{books.length === 0 ? (
								<Text style={styles.emptyText}>No books in library yet.</Text>
							) : (
								books.map((item) => (
									<LogListItem
										key={item.id}
										icon={Bookmark01Icon}
										iconColor={NeonColors.accent.teal}
										title={item.title}
										subtitle={item.subtitle}
										value={item.value}
										delta={item.delta}
										deltaColor={NeonColors.text.secondary}
										onPress={() => deleteEntry("library", item.id)}
									/>
								))
							)}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<FloatingActionButton color={NeonColors.accent.teal} onPress={() => setModalVisible(true)} />

			<AddEntryModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				onSave={handleSave}
				color={NeonColors.accent.teal}
				titleLabel="Add Book to Library"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	emptyText: {
		color: NeonColors.text.muted,
		fontSize: 16,
		textAlign: "center",
		marginTop: 32,
	},
	container: {
		flex: 1,
		backgroundColor: NeonColors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	viewContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	viewHeader: {
		marginBottom: 24,
	},
	viewTitle: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		marginTop: 4,
	},
	logsList: {
		marginTop: 12,
	},
});
