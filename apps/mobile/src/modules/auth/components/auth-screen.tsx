import type { ReactNode } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface AuthScreenProps {
	brand?: string;
	title: string;
	description: string;
	children?: ReactNode;
	footer?: ReactNode;
	busy?: boolean;
}

export function AuthScreen({
	brand = "Personal OS",
	title,
	description,
	children,
	footer,
	busy = false,
}: AuthScreenProps) {
	if (busy) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" className="text-primary" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					className="px-5 py-8"
				>
					<Card className="w-full max-w-[420px] self-center p-6">
						<CardHeader className="items-center text-center mb-6">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
								{brand}
							</Text>
							<CardTitle className="text-2xl font-bold text-center tracking-tight">
								{title}
							</CardTitle>
							<CardDescription className="text-center mt-1 text-sm">{description}</CardDescription>
						</CardHeader>
						<CardContent className="gap-4">{children}</CardContent>
					</Card>
					{footer ? <View className="mt-5 items-center">{footer}</View> : null}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
