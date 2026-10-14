import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import type { IdeaPart } from "../lib/idea";

type Action = { label: string; onPress: () => void };

export type DinnerIdeaCardProps = {
	title: string;
	parts: IdeaPart[];
	primary: Action;
	secondary?: Action;
	/** Opens the suggested recipe. */
	onOpen?: () => void;
};

function ActionButton({ action, primary }: { action: Action; primary: boolean }) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={action.label}
			onPress={() => {
				haptics.tap();
				action.onPress();
			}}
			style={({ pressed }) => [
				styles.button,
				primary ? styles.grow : null,
				{
					backgroundColor: primary ? colors.bgInverse : colors.bgSubtle,
					opacity: pressed ? 0.8 : 1,
				},
			]}
		>
			<PoText variant="meta13" tone={primary ? "textInverse" : "textPrimary"}>
				{action.label}
			</PoText>
		</Pressable>
	);
}

/** Figma "Dinner idea": a bundled recipe that fits what is left today. */
export function DinnerIdeaCard({ title, parts, primary, secondary, onOpen }: DinnerIdeaCardProps) {
	const { colors } = usePoTheme();
	const sentence = parts.map((part) => part.text).join("");

	return (
		<Card style={styles.card}>
			<Pressable
				accessibilityRole={onOpen ? "button" : undefined}
				accessibilityLabel={sentence}
				accessibilityHint={onOpen ? "Opens the recipe" : undefined}
				disabled={!onOpen}
				onPress={onOpen}
				style={styles.body}
			>
				<View style={styles.head}>
					<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
					<PoText variant="eyebrow11" tone="textSecondary">
						{title}
					</PoText>
				</View>
				<PoText variant="body15" tone="textSecondary">
					{parts.map((part, index) =>
						part.strong ? (
							<PoText
								// Sentence pieces are positional.
								key={index}
								variant="body15"
							>
								{part.text}
							</PoText>
						) : (
							part.text
						),
					)}
				</PoText>
			</Pressable>
			<View style={styles.actions}>
				<ActionButton action={primary} primary />
				{secondary ? <ActionButton action={secondary} primary={false} /> : null}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, paddingHorizontal: 18, paddingVertical: 16 },
	body: { gap: 12 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	actions: { flexDirection: "row", gap: 8 },
	button: {
		height: 44,
		paddingHorizontal: 18,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	grow: { flex: 1 },
});
