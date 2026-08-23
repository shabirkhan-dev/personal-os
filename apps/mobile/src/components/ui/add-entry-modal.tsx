import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";

interface AddEntryModalProps {
	visible: boolean;
	onClose: () => void;
	onSave: (title: string, subtitle: string, value: string, delta: string) => void;
	color?: string;
	titleLabel?: string;
}

export function AddEntryModal({
	visible,
	onClose,
	onSave,
	color = NeonColors.accent.green,
	titleLabel = "Add New Entry",
}: AddEntryModalProps) {
	const [title, setTitle] = useState("");
	const [subtitle, setSubtitle] = useState("");
	const [value, setValue] = useState("");
	const [delta, setDelta] = useState("");

	const handleSave = () => {
		if (!title) return;
		onSave(title, subtitle, value, delta);
		setTitle("");
		setSubtitle("");
		setValue("");
		setDelta("");
		onClose();
	};

	return (
		<Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.centeredView}
			>
				<View style={styles.modalView}>
					<View style={styles.header}>
						<Text style={[styles.modalTitle, { color }]}>{titleLabel}</Text>
						<Pressable onPress={onClose} style={styles.closeButton}>
							<Icon icon={Cancel01Icon} size={24} color={NeonColors.text.secondary} />
						</Pressable>
					</View>

					<View style={styles.form}>
						<TextInput
							style={styles.input}
							placeholder="Title (e.g., Avocado Toast)"
							placeholderTextColor={NeonColors.text.muted}
							value={title}
							onChangeText={setTitle}
							autoFocus
						/>
						<TextInput
							style={styles.input}
							placeholder="Subtitle (e.g., Breakfast)"
							placeholderTextColor={NeonColors.text.muted}
							value={subtitle}
							onChangeText={setSubtitle}
						/>
						<TextInput
							style={styles.input}
							placeholder="Value (e.g., 450 kcal)"
							placeholderTextColor={NeonColors.text.muted}
							value={value}
							onChangeText={setValue}
						/>
						<TextInput
							style={styles.input}
							placeholder="Secondary Info (e.g., 35g Protein)"
							placeholderTextColor={NeonColors.text.muted}
							value={delta}
							onChangeText={setDelta}
						/>

						<Pressable
							style={({ pressed }) => [
								styles.saveButton,
								{ backgroundColor: color },
								pressed && { opacity: 0.8 },
							]}
							onPress={handleSave}
						>
							<Text style={styles.saveButtonText}>Save Entry</Text>
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	modalView: {
		backgroundColor: NeonColors.surface,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		padding: 24,
		paddingBottom: 48,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 5,
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "600",
	},
	closeButton: {
		padding: 4,
	},
	form: {
		gap: 16,
	},
	input: {
		backgroundColor: "rgba(255,255,255,0.03)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		borderRadius: 12,
		padding: 16,
		color: NeonColors.text.primary,
		fontSize: 16,
	},
	saveButton: {
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginTop: 8,
	},
	saveButtonText: {
		color: NeonColors.background,
		fontSize: 16,
		fontWeight: "700",
	},
});
