import { CancelCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";

interface BillingResultScreenProps {
	variant: "success" | "cancel";
}

export function BillingResultScreen({ variant }: BillingResultScreenProps) {
	const isSuccess = variant === "success";

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />
				<View className="flex-1 items-center justify-center px-4">
					<Card className="p-6 w-full max-w-[380px] items-center text-center">
						<View
							className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
								isSuccess ? "bg-emerald-500/15" : "bg-destructive/15"
							}`}
						>
							<Icon
								icon={isSuccess ? CheckmarkCircle02Icon : CancelCircleIcon}
								size={32}
								className={isSuccess ? "text-emerald-500" : "text-destructive"}
								strokeWidth={2}
							/>
						</View>
						<Text className="text-foreground text-xl font-bold mb-2">
							{isSuccess ? "Payment Successful" : "Checkout Cancelled"}
						</Text>
						<Text className="text-muted-foreground text-xs text-center leading-relaxed mb-6">
							{isSuccess
								? "Your workspace subscription is now updated and active."
								: "Your transaction was not completed. No charges were made."}
						</Text>
						<View className="w-full gap-2.5">
							<Button onPress={() => router.replace("/(modules)/(profile)/billing")}>
								Return to Billing
							</Button>
							<Button variant="outline" onPress={() => router.replace("/(modules)/(dashboard)")}>
								Go to Dashboard
							</Button>
						</View>
					</Card>
				</View>
			</SafeAreaView>
		</View>
	);
}
