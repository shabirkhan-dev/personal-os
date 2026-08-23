import { Add01Icon, Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";
import { useCreateRoutineMutation } from "../hooks/use-routine-mutations";
import type { RoutineScheduleType } from "../types/routine.types";

interface AddRoutineModalProps {
	visible: boolean;
	onClose: () => void;
}

const WEEKDAYS = [
	{ id: 1, label: "M" },
	{ id: 2, label: "T" },
	{ id: 3, label: "W" },
	{ id: 4, label: "T" },
	{ id: 5, label: "F" },
	{ id: 6, label: "S" },
	{ id: 7, label: "S" },
];

export function AddRoutineModal({ visible, onClose }: AddRoutineModalProps) {
	const createMutation = useCreateRoutineMutation();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [scheduleType, setScheduleType] = useState<RoutineScheduleType>("daily");
	const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
	const [items, setItems] = useState<Array<{ name: string; targetTime: string }>>([
		{ name: "", targetTime: "" },
	]);

	const toggleDay = (day: number) => {
		if (selectedDays.includes(day)) {
			if (selectedDays.length === 1) return; // Keep at least one day
			setSelectedDays(selectedDays.filter((d) => d !== day));
		} else {
			setSelectedDays([...selectedDays, day].sort());
		}
	};

	const addItemStep = () => {
		setItems([...items, { name: "", targetTime: "" }]);
	};

	const updateItemStep = (index: number, field: "name" | "targetTime", value: string) => {
		const updated = [...items];
		const current = updated[index];
		if (!current) return;
		current[field] = value;
		setItems(updated);
	};

	const removeItemStep = (index: number) => {
		if (items.length <= 1) return;
		setItems(items.filter((_, i) => i !== index));
	};

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert("Required", "Please enter a routine name");
			return;
		}

		const validItems = items
			.filter((i) => i.name.trim().length > 0)
			.map((i, idx) => ({
				name: i.name.trim(),
				targetTime: i.targetTime.trim() || undefined,
				sortOrder: idx,
			}));

		if (validItems.length === 0) {
			Alert.alert("Required", "Please add at least one step for this routine");
			return;
		}

		try {
			await createMutation.mutateAsync({
				name: name.trim(),
				description: description.trim() || undefined,
				scheduleType,
				daysOfWeek: scheduleType === "specific_days" ? selectedDays : [],
				items: validItems,
			});

			setName("");
			setDescription("");
			setScheduleType("daily");
			setItems([{ name: "", targetTime: "" }]);
			onClose();
		} catch (error) {
			Alert.alert("Error", error instanceof Error ? error.message : "Failed to create routine");
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View
					style={styles.modalContent}
					className="bg-[#15161A] rounded-3xl p-5 border border-white/[0.08] w-[92%] max-h-[85%]"
				>
					{/* Modal Header */}
					<View className="flex-row items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
						<Text className="text-white font-bold text-lg">Create Routine</Text>
						<Pressable onPress={onClose} className="p-1">
							<Icon icon={Cancel01Icon} size={20} color="#888888" />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} className="mb-4">
						{/* Routine Name */}
						<View className="mb-4">
							<Text className="text-[#888888] text-xs font-bold uppercase tracking-wider mb-1.5">
								Routine Name
							</Text>
							<TextInput
								value={name}
								onChangeText={setName}
								placeholder="e.g. Morning Protocol"
								placeholderTextColor="#555555"
								className="bg-[#0B0C10] text-white px-3.5 py-3 rounded-2xl border border-white/[0.06] text-sm font-medium"
							/>
						</View>

						{/* Description */}
						<View className="mb-4">
							<Text className="text-[#888888] text-xs font-bold uppercase tracking-wider mb-1.5">
								Description (Optional)
							</Text>
							<TextInput
								value={description}
								onChangeText={setDescription}
								placeholder="e.g. Daily activation sequence"
								placeholderTextColor="#555555"
								className="bg-[#0B0C10] text-white px-3.5 py-2.5 rounded-2xl border border-white/[0.06] text-xs"
							/>
						</View>

						{/* Schedule Type Switcher */}
						<View className="mb-4">
							<Text className="text-[#888888] text-xs font-bold uppercase tracking-wider mb-2">
								Schedule
							</Text>
							<View className="flex-row p-1 bg-[#0B0C10] rounded-xl border border-white/[0.04]">
								<Pressable
									onPress={() => setScheduleType("daily")}
									className={`flex-1 py-2 rounded-lg items-center ${
										scheduleType === "daily" ? "bg-white" : ""
									}`}
								>
									<Text
										className={`text-xs font-bold ${
											scheduleType === "daily" ? "text-black" : "text-[#888888]"
										}`}
									>
										Everyday
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setScheduleType("specific_days")}
									className={`flex-1 py-2 rounded-lg items-center ${
										scheduleType === "specific_days" ? "bg-white" : ""
									}`}
								>
									<Text
										className={`text-xs font-bold ${
											scheduleType === "specific_days" ? "text-black" : "text-[#888888]"
										}`}
									>
										Specific Days
									</Text>
								</Pressable>
							</View>
						</View>

						{/* Specific Days Picker */}
						{scheduleType === "specific_days" && (
							<View className="flex-row justify-between mb-4">
								{WEEKDAYS.map((day) => {
									const isSelected = selectedDays.includes(day.id);
									return (
										<Pressable
											key={day.id}
											onPress={() => toggleDay(day.id)}
											className={`w-9 h-9 rounded-xl items-center justify-center border ${
												isSelected
													? "bg-green-500/20 border-green-400"
													: "bg-[#0B0C10] border-white/[0.06]"
											}`}
										>
											<Text
												className={`text-xs font-bold ${
													isSelected ? "text-green-400" : "text-[#888888]"
												}`}
											>
												{day.label}
											</Text>
										</Pressable>
									);
								})}
							</View>
						)}

						{/* Steps Builder */}
						<View className="mb-4">
							<View className="flex-row items-center justify-between mb-2">
								<Text className="text-[#888888] text-xs font-bold uppercase tracking-wider">
									Steps ({items.length})
								</Text>
								<Pressable
									onPress={addItemStep}
									className="flex-row items-center gap-1 bg-green-500/15 px-2.5 py-1 rounded-lg"
								>
									<Icon icon={Add01Icon} size={14} color={NeonColors.accent.green} />
									<Text className="text-green-400 text-xs font-bold">Add Step</Text>
								</Pressable>
							</View>

							{items.map((step, idx) => (
								<View
									key={idx}
									className="flex-row items-center gap-2 mb-2 bg-[#0B0C10] p-2 rounded-2xl border border-white/[0.04]"
								>
									<Text className="text-[#555555] font-mono text-xs pl-1">{idx + 1}.</Text>
									<TextInput
										value={step.name}
										onChangeText={(val) => updateItemStep(idx, "name", val)}
										placeholder="e.g. 500ml Water"
										placeholderTextColor="#555555"
										className="flex-1 text-white text-xs py-1"
									/>
									<TextInput
										value={step.targetTime}
										onChangeText={(val) => updateItemStep(idx, "targetTime", val)}
										placeholder="07:00"
										placeholderTextColor="#444444"
										className="w-14 text-center text-[#888888] text-xs bg-[#15161A] py-1 rounded-lg border border-white/[0.04]"
									/>
									{items.length > 1 && (
										<Pressable onPress={() => removeItemStep(idx)} className="p-1">
											<Icon icon={Delete02Icon} size={14} color="#FF5252" />
										</Pressable>
									)}
								</View>
							))}
						</View>
					</ScrollView>

					{/* Submit Button */}
					<Pressable
						onPress={handleSave}
						disabled={createMutation.isPending}
						className="w-full bg-white py-3.5 rounded-2xl items-center justify-center shadow-lg"
					>
						{createMutation.isPending ? (
							<ActivityIndicator color="#000000" />
						) : (
							<Text className="text-black font-bold text-sm">Create Routine</Text>
						)}
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		backgroundColor: "#15161A",
	},
});
