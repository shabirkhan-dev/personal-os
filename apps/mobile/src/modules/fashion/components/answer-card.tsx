import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import type { Piece } from "../lib/fashion-model";
import { PieceImage } from "./piece-image";

/** The Fashion AI's answer: the pieces it picked from the wardrobe, ready to wear. */
export function AnswerCard({
	question,
	answer,
	outfit,
	followUps,
	onWear,
	onFollowUp,
	onDone,
}: {
	question: string;
	answer: string;
	outfit: readonly Piece[];
	followUps: readonly string[];
	onWear: (pieces: readonly Piece[]) => void;
	onFollowUp: (question: string) => void;
	onDone: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.accentDefault },
			]}
		>
			<View style={styles.eyebrow}>
				<Icon name="Filled/Sparkle" size={14} color={colors.accentDefault} />
				<PoText variant="eyebrow11" tone="textTertiary">
					Answer
				</PoText>
			</View>
			<PoText variant="mono13" tone="textSecondary">
				“{question}”
			</PoText>
			<PoText variant="body15">{answer}</PoText>
			{outfit.length > 0 ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.outfit}
				>
					{outfit.map((piece) => (
						<View key={piece.id} style={styles.item}>
							<PieceImage
								image={piece.image}
								category={piece.category}
								colour={piece.colour}
								size={72}
								radius={16}
							/>
							<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
								{piece.name}
							</PoText>
						</View>
					))}
				</ScrollView>
			) : null}
			{followUps.length > 0 ? (
				<View style={styles.followUps}>
					{followUps.map((item) => (
						<Pressable
							key={item}
							accessibilityRole="button"
							onPress={() => {
								haptics.tap();
								onFollowUp(item);
							}}
							style={[styles.followUp, { backgroundColor: colors.bgSubtle }]}
						>
							<PoText variant="meta13" tone="textSecondary">
								{item}
							</PoText>
						</Pressable>
					))}
				</View>
			) : null}
			<View style={styles.actions}>
				{outfit.length > 0 ? (
					<PillButton label="Wear this" onPress={() => onWear(outfit)} style={styles.flex} />
				) : null}
				<PillButton
					label="Done"
					variant={outfit.length > 0 ? "secondary" : "primary"}
					onPress={onDone}
					style={styles.flex}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	outfit: { gap: 10 },
	item: { width: 72, gap: 4 },
	followUps: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	followUp: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
	actions: { flexDirection: "row", gap: 8, paddingTop: 4 },
});
