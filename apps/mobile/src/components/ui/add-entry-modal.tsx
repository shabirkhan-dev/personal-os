import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";

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
	color,
	titleLabel = "Add New Entry",
}: AddEntryModalProps) {
	const { colors } = useTheme();
	const resolvedColor = color ?? colors.accent.green;
	const [title, setTitle] = useState("");
	const [subtitle, setSubtitle] = useState("");
	const [value, setValue] = useState("");
	const [delta, setDelta] = useState("");

	const handleSave = () => {
		if (!title.trim()) return;
		onSave(title.trim(), subtitle.trim(), value.trim(), delta.trim());
		setTitle("");
		setSubtitle("");
		setValue("");
		setDelta("");
		onClose();
	};

	return (
		<Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1 justify-end bg-black/60"
			>
				<View className="bg-card rounded-t-[32px] p-6 pb-12 border border-border">
					<View className="flex-row justify-between items-center mb-6">
						<Text className="text-primary text-xl font-semibold" style={{ color: resolvedColor }}>
							{titleLabel}
						</Text>
						<Pressable onPress={onClose} className="p-1" accessibilityLabel="Close modal">
							<Icon icon={Cancel01Icon} size={24} className="text-muted-foreground" />
						</Pressable>
					</View>

					<View className="gap-4">
						<TextInput
							className="bg-muted/40 border border-input rounded-xl p-4 text-foreground text-base"
							placeholder="Title (e.g., Avocado Toast)"
							placeholderTextColor={colors.text.muted}
							value={title}
							onChangeText={setTitle}
							autoFocus
						/>
						<TextInput
							className="bg-muted/40 border border-input rounded-xl p-4 text-foreground text-base"
							placeholder="Subtitle (e.g., Breakfast)"
							placeholderTextColor={colors.text.muted}
							value={subtitle}
							onChangeText={setSubtitle}
						/>
						<TextInput
							className="bg-muted/40 border border-input rounded-xl p-4 text-foreground text-base"
							placeholder="Value (e.g., 450 kcal)"
							placeholderTextColor={colors.text.muted}
							value={value}
							onChangeText={setValue}
						/>
						<TextInput
							className="bg-muted/40 border border-input rounded-xl p-4 text-foreground text-base"
							placeholder="Secondary Info (e.g., 35g Protein)"
							placeholderTextColor={colors.text.muted}
							value={delta}
							onChangeText={setDelta}
						/>

						<Pressable
							className="rounded-xl p-4 items-center mt-2 active:opacity-80"
							style={{ backgroundColor: resolvedColor }}
							onPress={handleSave}
						>
							<Text className="text-primary-foreground text-base font-bold">Save Entry</Text>
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
