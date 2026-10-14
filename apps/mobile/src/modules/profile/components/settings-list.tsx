import type { ColorTokens } from "@personal-os/tokens";
import { Children, Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";

type Tone = keyof ColorTokens;

/** Mono eyebrow above a settings card ("MODULES", "YOUR DATA"…). */
export function SectionLabel({ children }: { children: string }) {
	return (
		<View style={styles.label}>
			<PoText variant="eyebrow11" tone="textTertiary" accessibilityRole="header">
				{children.toUpperCase()}
			</PoText>
		</View>
	);
}

/** Kit v2 settings card: rows separated by a hairline. */
export function SettingsCard({ children }: { children: ReactNode }) {
	const { colors } = usePoTheme();
	const rows = Children.toArray(children);
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			{rows.map((row, index) => (
				<Fragment key={index}>
					{index > 0 ? (
						<View style={[styles.hairline, { backgroundColor: colors.borderDefault }]} />
					) : null}
					{row}
				</Fragment>
			))}
		</View>
	);
}

export type SettingsRowProps = {
	icon: IconName;
	/** Artwork drawn instead of the icon tile (e.g. the logo mark). */
	mark?: ReactNode;
	iconTone?: Tone;
	tileTone?: Tone;
	title: string;
	titleTone?: Tone;
	meta?: string;
	/** Short value before the chevron ("System", "4 on"). */
	value?: string;
	/** Replaces value + chevron (a pill, a toggle). */
	accessory?: ReactNode;
	onPress?: () => void;
	accessibilityHint?: string;
};

/** One settings row: 40px icon tile, title (+ meta), and a value with chevron or an accessory. */
export function SettingsRow({
	icon,
	mark,
	iconTone = "textPrimary",
	tileTone = "bgSubtle",
	title,
	titleTone = "textPrimary",
	meta,
	value,
	accessory,
	onPress,
	accessibilityHint,
}: SettingsRowProps) {
	const { colors } = usePoTheme();
	const body = (
		<>
			<View style={[styles.tile, mark ? null : { backgroundColor: colors[tileTone] }]}>
				{mark ?? <Icon name={icon} color={colors[iconTone]} />}
			</View>
			<View style={styles.text}>
				<PoText variant="row15" tone={titleTone} numberOfLines={1}>
					{title}
				</PoText>
				{meta ? (
					<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
						{meta}
					</PoText>
				) : null}
			</View>
			{accessory ??
				(onPress ? (
					<View style={styles.value}>
						{value ? (
							<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
								{value}
							</PoText>
						) : null}
						<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
					</View>
				) : null)}
		</>
	);

	if (!onPress) {
		return (
			<View
				style={styles.row}
				accessible
				accessibilityLabel={[title, meta].filter(Boolean).join(", ")}
			>
				{body}
			</View>
		);
	}
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={[title, meta, value].filter(Boolean).join(", ")}
			accessibilityHint={accessibilityHint}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
		>
			{body}
		</Pressable>
	);
}

export type RowPillProps = {
	label: string;
	onPress?: () => void;
	accessibilityLabel?: string;
};

/** Small 36px pill at the end of a row: "Connect"-style action, or a quiet "Soon" tag. */
export function RowPill({ label, onPress, accessibilityLabel }: RowPillProps) {
	const { colors } = usePoTheme();
	const style = [
		styles.pill,
		{ backgroundColor: colors.bgSubtle, borderColor: colors.borderDefault },
	];
	if (!onPress) {
		return (
			<View style={style}>
				<PoText variant="meta13" tone="textTertiary">
					{label}
				</PoText>
			</View>
		);
	}
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			hitSlop={6}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [...style, pressed ? { backgroundColor: colors.bgHover } : null]}
		>
			<PoText variant="meta13">{label}</PoText>
		</Pressable>
	);
}

/** The honest end-of-row tag for things that do not exist yet. */
export function SoonTag() {
	return <RowPill label="Soon" />;
}

const styles = StyleSheet.create({
	label: { paddingLeft: 6, paddingTop: 10 },
	card: {
		paddingHorizontal: 14,
		paddingVertical: 4,
		borderRadius: 28,
		borderWidth: 1,
		overflow: "hidden",
	},
	hairline: { height: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
	pressed: { opacity: 0.6 },
	tile: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	text: { flex: 1, gap: 2, minWidth: 0 },
	value: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 160 },
	pill: {
		height: 36,
		paddingHorizontal: 16,
		borderRadius: 18,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
