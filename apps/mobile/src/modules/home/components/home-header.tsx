import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Glow } from "@/components/ui/glow";
import { HeaderButton } from "@/components/ui/header-button";
import { PoText } from "@/components/ui/po-text";
import { Avatar } from "@/modules/onboarding/components/avatar";
import { usePoTheme } from "@/theme";
import type { HomeHero } from "../lib/module-home";
import { haptics } from "@/lib/haptics";

export type HomeHeaderProps = {
	name: string;
	topInset: number;
	/** Text in the pill: the first name on Overview, the module name on a module Home. */
	label: string;
	glow: keyof ColorTokens;
	/** Whether the module picker is open (the Apps button turns inverse). */
	pickerOpen: boolean;
	onAppsPress: () => void;
	/** Opens the module's screens; without it the pill is just a label. */
	onPillPress?: () => void;
	action: { icon: IconName; label: string; onPress: () => void };
	hero?: HomeHero;
	amountsHidden?: boolean;
	onToggleHidden?: () => void;
	/** Drawn behind everything, under the glow (Faith's Sky). */
	backdrop?: ReactNode;
};

/** Kit v2 "Home Header": glow, Apps button, module pill, a module action and the hero number. */
export function HomeHeader({
	name,
	topInset,
	label,
	glow,
	pickerOpen,
	onAppsPress,
	onPillPress,
	action,
	hero,
	amountsHidden = false,
	onToggleHidden,
	backdrop,
}: HomeHeaderProps) {
	const { colors } = usePoTheme();
	const hidden = Boolean(hero?.hideable && amountsHidden);

	return (
		<View style={[styles.header, { paddingTop: topInset + 6 }, hero ? styles.withHero : null]}>
			{backdrop}
			<Glow tone={glow} width={340} height={240} left={-90} top={-110} blur={110} />
			<View style={styles.row}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={pickerOpen ? "Close modules" : "Open modules"}
					accessibilityState={{ expanded: pickerOpen }}
					hitSlop={8}
					onPress={() => {
						haptics.tap();
						onAppsPress();
					}}
					style={[
						styles.round,
						pickerOpen
							? { backgroundColor: colors.bgInverse }
							: { backgroundColor: colors.bgSurface },
					]}
				>
					<Icon name="Filled/Grid" color={pickerOpen ? colors.textInverse : colors.textPrimary} />
				</Pressable>
				<Pressable
					accessibilityRole={onPillPress ? "button" : undefined}
					accessibilityLabel={onPillPress ? `${label}, its screens` : label}
					disabled={!onPillPress}
					onPress={() => {
						haptics.tap();
						onPillPress?.();
					}}
					style={({ pressed }) => [
						styles.pill,
						{
							backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
						},
					]}
				>
					<Avatar name={name} size={32} />
					<PoText variant="text14Medium" numberOfLines={1} style={styles.name}>
						{label}
					</PoText>
					{onPillPress ? (
						<Icon name="Filled/Chevron down" size={16} color={colors.textSecondary} />
					) : null}
				</Pressable>
				<HeaderButton
					icon={action.icon}
					accessibilityLabel={action.label}
					onPress={action.onPress}
				/>
			</View>
			{hero ? (
				<View style={styles.hero}>
					<Pressable
						accessibilityRole={hero.onLabelPress ? "button" : undefined}
						disabled={!hero.onLabelPress}
						hitSlop={8}
						onPress={hero.onLabelPress}
						style={styles.labelRow}
					>
						<PoText variant="text14" tone="textSecondary" numberOfLines={1}>
							{hero.label}
						</PoText>
						{hero.onLabelPress ? (
							<Icon name="Filled/Chevron down" size={16} color={colors.textSecondary} />
						) : null}
					</Pressable>
					<View style={styles.amountRow} accessibilityLabel={hidden ? "Amount hidden" : undefined}>
						<PoText variant="display36" numberOfLines={1} adjustsFontSizeToFit>
							{hidden ? "••••••" : hero.value}
							{!hidden && hero.faint ? (
								<PoText variant="display36" tone="textTertiary">
									{hero.faint}
								</PoText>
							) : null}
						</PoText>
						{hero.hideable && onToggleHidden ? (
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={hidden ? "Show amounts" : "Hide amounts"}
								hitSlop={10}
								onPress={() => {
									haptics.select();
									onToggleHidden();
								}}
								style={styles.eye}
							>
								<Icon name="Filled/Eye" color={colors.textSecondary} />
							</Pressable>
						) : null}
					</View>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: { alignItems: "center", paddingBottom: 20, paddingHorizontal: 24 },
	withHero: { gap: 32, paddingBottom: 32 },
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	round: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	pill: {
		height: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 4,
		paddingRight: 12,
		borderRadius: 999,
	},
	name: { maxWidth: 140 },
	hero: { alignItems: "center", gap: 4, maxWidth: "100%" },
	labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	amountRow: { flexDirection: "row", alignItems: "center", maxWidth: "100%" },
	eye: { paddingLeft: 12 },
});
