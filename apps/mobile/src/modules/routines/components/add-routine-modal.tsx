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
import { useTheme } from "@/providers/theme-provider";
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
	const { colors, isDark } = useTheme();
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
					style={[
						styles.modalContent,
						{
							backgroundColor: colors.surface,
							borderColor: colors.card.border,
						},
					]}
					className="rounded-3xl p-5 border w-[92%] max-h-[85%]"
				>
					{/* Modal Header */}
					<View
						style={{ borderBottomColor: colors.card.border }}
						className="flex-row items-center justify-between pb-3 border-b mb-4"
					>
						<Text style={{ color: colors.text.primary }} className="font-bold text-lg">
							Create Routine
						</Text>
						<Pressable onPress={onClose} className="p-1">
							<Icon icon={Cancel01Icon} size={20} color={colors.text.secondary} />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} className="mb-4">
						{/* Routine Name */}
						<View className="mb-4">
							<Text
								style={{ color: colors.text.secondary }}
								className="text-xs font-bold uppercase tracking-wider mb-1.5"
							>
								Routine Name
							</Text>
							<TextInput
								value={name}
								onChangeText={setName}
								placeholder="e.g. Morning Protocol"
								placeholderTextColor={colors.text.muted}
								style={{
									backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
									borderColor: colors.card.border,
									color: colors.text.primary,
								}}
								className="px-3.5 py-3 rounded-2xl border text-sm font-medium"
							/>
						</View>

						{/* Description */}
						<View className="mb-4">
							<Text
								style={{ color: colors.text.secondary }}
								className="text-xs font-bold uppercase tracking-wider mb-1.5"
							>
								Description (Optional)
							</Text>
							<TextInput
								value={description}
								onChangeText={setDescription}
								placeholder="e.g. Daily activation sequence"
								placeholderTextColor={colors.text.muted}
								style={{
									backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
									borderColor: colors.card.border,
									color: colors.text.primary,
								}}
								className="px-3.5 py-2.5 rounded-2xl border text-xs"
							/>
						</View>

						{/* Schedule Type Switcher */}
						<View className="mb-4">
							<Text
								style={{ color: colors.text.secondary }}
								className="text-xs font-bold uppercase tracking-wider mb-2"
							>
								Schedule
							</Text>
							<View
								style={{
									backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
									borderColor: colors.card.border,
								}}
								className="flex-row p-1 rounded-xl border"
							>
								<Pressable
									onPress={() => setScheduleType("daily")}
									style={[
										scheduleType === "daily" && {
											backgroundColor: isDark ? "#FFFFFF" : "#0F172A",
										},
									]}
									className="flex-1 py-2 rounded-lg items-center"
								>
									<Text
										style={{
											color:
												scheduleType === "daily"
													? isDark
														? "#000000"
														: "#FFFFFF"
													: colors.text.secondary,
										}}
										className="text-xs font-bold"
									>
										Everyday
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setScheduleType("specific_days")}
									style={[
										scheduleType === "specific_days" && {
											backgroundColor: isDark ? "#FFFFFF" : "#0F172A",
										},
									]}
									className="flex-1 py-2 rounded-lg items-center"
								>
									<Text
										style={{
											color:
												scheduleType === "specific_days"
													? isDark
														? "#000000"
														: "#FFFFFF"
													: colors.text.secondary,
										}}
										className="text-xs font-bold"
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
											style={{
												backgroundColor: isSelected
													? `${colors.accent.green}25`
													: isDark
														? "rgba(255, 255, 255, 0.03)"
														: "rgba(0, 0, 0, 0.03)",
												borderColor: isSelected ? colors.accent.green : colors.card.border,
											}}
											className="w-9 h-9 rounded-xl items-center justify-center border"
										>
											<Text
												style={{
													color: isSelected ? colors.accent.green : colors.text.secondary,
												}}
												className="text-xs font-bold"
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
								<Text
									style={{ color: colors.text.secondary }}
									className="text-xs font-bold uppercase tracking-wider"
								>
									Steps ({items.length})
								</Text>
								<Pressable
									onPress={addItemStep}
									style={{ backgroundColor: `${colors.accent.green}20` }}
									className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg"
								>
									<Icon icon={Add01Icon} size={14} color={colors.accent.green} />
									<Text style={{ color: colors.accent.green }} className="text-xs font-bold">
										Add Step
									</Text>
								</Pressable>
							</View>

							{items.map((step, idx) => (
								<View
									key={idx}
									style={{
										backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
										borderColor: colors.card.border,
									}}
									className="flex-row items-center gap-2 mb-2 p-2 rounded-2xl border"
								>
									<Text style={{ color: colors.text.muted }} className="font-mono text-xs pl-1">
										{idx + 1}.
									</Text>
									<TextInput
										value={step.name}
										onChangeText={(val) => updateItemStep(idx, "name", val)}
										placeholder="e.g. 500ml Water"
										placeholderTextColor={colors.text.muted}
										style={{ color: colors.text.primary }}
										className="flex-1 text-xs py-1"
									/>
									<TextInput
										value={step.targetTime}
										onChangeText={(val) => updateItemStep(idx, "targetTime", val)}
										placeholder="07:00"
										placeholderTextColor={colors.text.muted}
										style={{
											backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
											borderColor: colors.card.border,
											color: colors.text.secondary,
										}}
										className="w-14 text-center text-xs py-1 rounded-lg border"
									/>
									{items.length > 1 && (
										<Pressable onPress={() => removeItemStep(idx)} className="p-1">
											<Icon icon={Delete02Icon} size={14} color={colors.accent.red} />
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
						style={{
							backgroundColor: isDark ? "#FFFFFF" : "#0F172A",
						}}
						className="w-full py-3.5 rounded-2xl items-center justify-center shadow-lg"
					>
						{createMutation.isPending ? (
							<ActivityIndicator color={isDark ? "#000000" : "#FFFFFF"} />
						) : (
							<Text style={{ color: isDark ? "#000000" : "#FFFFFF" }} className="font-bold text-sm">
								Create Routine
							</Text>
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
	modalContent: {},
});
