import { Add01Icon, Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
			if (selectedDays.length === 1) return;
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
			<View className="flex-1 bg-black/70 justify-center items-center">
				<View className="bg-card rounded-3xl p-5 border border-border w-[92%] max-h-[85%]">
					{/* Modal Header */}
					<View className="flex-row items-center justify-between pb-3 border-b border-border/40 mb-4">
						<Text className="text-foreground font-bold text-lg">Create Routine</Text>
						<Pressable onPress={onClose} className="p-1">
							<Icon icon={Cancel01Icon} size={20} className="text-muted-foreground" />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} className="mb-4">
						{/* Routine Name */}
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">
								Routine Name
							</Text>
							<Input value={name} onChangeText={setName} placeholder="e.g. Morning Protocol" />
						</View>

						{/* Description */}
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">
								Description (Optional)
							</Text>
							<Input
								value={description}
								onChangeText={setDescription}
								placeholder="e.g. Daily activation sequence"
							/>
						</View>

						{/* Schedule Type Switcher */}
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
								Schedule
							</Text>
							<View className="flex-row p-1 bg-muted/60 border border-border/40 rounded-2xl">
								<Pressable
									onPress={() => setScheduleType("daily")}
									className={cn(
										"flex-1 py-2 rounded-xl items-center",
										scheduleType === "daily" && "bg-card border border-border/60 shadow-sm",
									)}
								>
									<Text
										className={cn(
											"text-xs font-bold",
											scheduleType === "daily" ? "text-card-foreground" : "text-muted-foreground",
										)}
									>
										Everyday
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setScheduleType("specific_days")}
									className={cn(
										"flex-1 py-2 rounded-xl items-center",
										scheduleType === "specific_days" && "bg-card border border-border/60 shadow-sm",
									)}
								>
									<Text
										className={cn(
											"text-xs font-bold",
											scheduleType === "specific_days"
												? "text-card-foreground"
												: "text-muted-foreground",
										)}
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
											className={cn(
												"w-9 h-9 rounded-xl items-center justify-center border",
												isSelected ? "bg-primary/20 border-primary" : "bg-muted/40 border-border",
											)}
										>
											<Text
												className={cn(
													"text-xs font-bold",
													isSelected ? "text-primary" : "text-muted-foreground",
												)}
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
								<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
									Steps ({items.length})
								</Text>
								<Pressable
									onPress={addItemStep}
									className="flex-row items-center gap-1 bg-primary/15 px-2.5 py-1 rounded-lg"
								>
									<Icon icon={Add01Icon} size={14} className="text-primary" />
									<Text className="text-primary text-xs font-bold">Add Step</Text>
								</Pressable>
							</View>

							{items.map((step, idx) => (
								<View
									key={idx}
									className="flex-row items-center gap-2 mb-2 bg-muted/40 p-2 rounded-2xl border border-border/60"
								>
									<Text className="text-muted-foreground font-mono text-xs pl-1">{idx + 1}.</Text>
									<TextInput
										value={step.name}
										onChangeText={(val) => updateItemStep(idx, "name", val)}
										placeholder="e.g. 500ml Water"
										placeholderTextColor="#888888"
										className="flex-1 text-foreground text-xs py-1"
									/>
									<TextInput
										value={step.targetTime}
										onChangeText={(val) => updateItemStep(idx, "targetTime", val)}
										placeholder="07:00"
										placeholderTextColor="#888888"
										className="w-14 text-center text-xs py-1 rounded-lg border border-border/40 text-muted-foreground bg-card"
									/>
									{items.length > 1 && (
										<Pressable onPress={() => removeItemStep(idx)} className="p-1">
											<Icon icon={Delete02Icon} size={14} className="text-destructive" />
										</Pressable>
									)}
								</View>
							))}
						</View>
					</ScrollView>

					{/* Submit Button */}
					<Button onPress={handleSave} loading={createMutation.isPending}>
						Create Routine
					</Button>
				</View>
			</View>
		</Modal>
	);
}
