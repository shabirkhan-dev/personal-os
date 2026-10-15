import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

export type AyahCardProps = {
	/** "Ayah of the day · Ash-Sharh 94:5", "When you wake up". */
	eyebrow: string;
	arabic: string;
	translation: string;
	/** Dimmer words after the translation: "Picked for a week of job hunting." */
	note?: string;
	speaking: boolean;
	/** Hidden when the phone has no text-to-speech. */
	canSpeak: boolean;
	onRecite: () => void;
	secondary: { label: string; onPress: () => void };
};

/**
 * The Moment card: an ayah or a dua with its meaning, chosen by the time of day. Recite now reads
 * the Arabic, then the translation, aloud.
 */
export function AyahCard({
	eyebrow,
	arabic,
	translation,
	note,
	speaking,
	canSpeak,
	onRecite,
	secondary,
}: AyahCardProps) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.eyebrow}>
				<Icon name="Filled/Sparkle" size={14} color={colors.statusViolet} />
				<PoText variant="eyebrow11" tone="textTertiary" numberOfLines={1} style={styles.flex}>
					{eyebrow}
				</PoText>
			</View>
			<PoText variant="arabic30" style={styles.arabic} accessibilityLanguage="ar">
				{arabic}
			</PoText>
			<PoText variant="body15">
				{translation}
				{note ? <PoText variant="body15" tone="textSecondary">{` ${note}`}</PoText> : null}
			</PoText>
			<View style={styles.actions}>
				{canSpeak ? (
					<PillButton
						label={speaking ? "Stop" : "Recite now"}
						onPress={onRecite}
						style={styles.flex}
					/>
				) : null}
				<PillButton
					label={secondary.label}
					variant="secondary"
					onPress={secondary.onPress}
					style={canSpeak ? undefined : styles.flex}
				/>
			</View>
		</View>
	);
}

export type AnswerCardProps = {
	question: string;
	answer: string;
	followUps: readonly string[];
	speaking: boolean;
	canSpeak: boolean;
	onListen: () => void;
	onFollowUp: (question: string) => void;
	onDone: () => void;
};

/** The Faith AI's answer under the ask bar, with follow-up questions to tap. */
export function AnswerCard({
	question,
	answer,
	followUps,
	speaking,
	canSpeak,
	onListen,
	onFollowUp,
	onDone,
}: AnswerCardProps) {
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
			<PoText variant="meta13" tone="textTertiary">
				AI can be wrong. For a ruling on your own case, ask a scholar of your tradition.
			</PoText>
			<View style={styles.actions}>
				{canSpeak ? (
					<PillButton
						label={speaking ? "Stop" : "Listen"}
						variant="secondary"
						onPress={onListen}
						style={styles.flex}
					/>
				) : null}
				<PillButton label="Done" onPress={onDone} style={styles.flex} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
	arabic: { textAlign: "right", writingDirection: "rtl" },
	actions: { flexDirection: "row", gap: 8, paddingTop: 4 },
	followUps: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	followUp: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
});
