import type { ReactNode } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NeonCard } from "@/components/ui/neon-card";
import { useTheme } from "@/providers/theme-provider";

interface AuthScreenProps {
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
	const { colors } = useTheme();

	if (busy) {
		return (
			<SafeAreaView
				style={[styles.safe, { backgroundColor: colors.background }]}
				edges={["top", "bottom"]}
			>
				<View style={styles.loading}>
					<ActivityIndicator color={colors.accent.green} size="large" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.safe, { backgroundColor: colors.background }]}
			edges={["top", "bottom"]}
		>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<NeonCard style={styles.card}>
						<Text style={[styles.brand, { color: colors.text.secondary }]}>{brand}</Text>
						<Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
						<Text style={[styles.description, { color: colors.text.secondary }]}>
							{description}
						</Text>
						<View style={styles.content}>{children}</View>
					</NeonCard>
					{footer ? <View style={styles.footer}>{footer}</View> : null}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
	},
	flex: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 20,
		paddingVertical: 32,
	},
	card: {
		width: "100%",
		maxWidth: 420,
		alignSelf: "center",
	},
	brand: {
		fontSize: 13,
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 8,
		letterSpacing: -0.5,
	},
	description: {
		fontSize: 15,
		textAlign: "center",
		marginBottom: 24,
		lineHeight: 22,
	},
	content: {
		gap: 16,
	},
	footer: {
		marginTop: 20,
		alignItems: "center",
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
