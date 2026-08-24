import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface AuthFieldProps {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	secureTextEntry?: boolean;
	showPasswordToggle?: boolean;
	onTogglePassword?: () => void;
	keyboardType?: "default" | "email-address" | "number-pad";
	autoComplete?: TextInput["props"]["autoComplete"];
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	editable?: boolean;
	hint?: string;
	errorHint?: string;
	maxLength?: number;
	multiline?: boolean;
	numberOfLines?: number;
	rightLink?: { label: string; onPress: () => void };
}

export function AuthField({
	label,
	value,
	onChangeText,
	placeholder,
	secureTextEntry,
	showPasswordToggle,
	onTogglePassword,
	keyboardType = "default",
	autoComplete,
	autoCapitalize = "none",
	editable = true,
	hint,
	errorHint,
	maxLength,
	multiline = false,
	numberOfLines,
	rightLink,
}: AuthFieldProps) {
	return (
		<View className="flex-col gap-1.5 mb-3">
			<View className="flex-row items-center justify-between">
				<Text className="text-foreground text-xs font-semibold uppercase tracking-wider">
					{label}
				</Text>
				{rightLink ? (
					<Pressable onPress={rightLink.onPress} hitSlop={8}>
						<Text className="text-primary text-xs font-semibold">{rightLink.label}</Text>
					</Pressable>
				) : null}
			</View>

			<View
				className={cn(
					"flex-row items-center bg-muted/40 border border-border rounded-2xl px-4 min-h-[48px]",
					errorHint && "border-destructive bg-destructive/5",
					multiline && "items-start min-h-[100px] py-2",
				)}
			>
				<TextInput
					className={cn(
						"flex-1 text-foreground text-sm py-2.5 font-medium placeholder:text-muted-foreground",
						multiline && "min-h-[84px] pt-1",
					)}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					secureTextEntry={secureTextEntry}
					keyboardType={keyboardType}
					autoComplete={autoComplete}
					autoCapitalize={autoCapitalize}
					editable={editable}
					maxLength={maxLength}
					multiline={multiline}
					numberOfLines={numberOfLines}
					textAlignVertical={multiline ? "top" : "center"}
				/>
				{showPasswordToggle ? (
					<Pressable onPress={onTogglePassword} hitSlop={8} className="pl-2.5">
						<Icon
							icon={secureTextEntry ? ViewIcon : ViewOffIcon}
							size={18}
							className="text-muted-foreground"
						/>
					</Pressable>
				) : null}
			</View>

			{errorHint ? <Text className="text-destructive text-xs">{errorHint}</Text> : null}
			{!errorHint && hint ? <Text className="text-muted-foreground text-xs">{hint}</Text> : null}
		</View>
	);
}
