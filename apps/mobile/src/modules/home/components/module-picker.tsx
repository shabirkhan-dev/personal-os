import { elevation } from "@personal-os/tokens";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { toShadowStyle, usePoTheme } from "@/theme";
import type { ModuleStatus } from "../lib/today";

export type ModulePickerProps = {
	top: number;
	modules: readonly ModuleStatus[];
	onClose: () => void;
	onAddModule: (id: ModuleId) => void;
};

type RowProps = {
	icon: IconName;
	iconTone: ModuleStatus["iconTone"];
	tileTone: ModuleStatus["tileTone"];
	name: string;
	status: string;
	trailing?: React.ReactNode;
	selected?: boolean;
	onPress?: () => void;
	accessibilityHint?: string;
};

function Row({
	icon,
	iconTone,
	tileTone,
	name,
	status,
	trailing,
	selected,
	onPress,
	accessibilityHint,
}: RowProps) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${name}, ${status}`}
			accessibilityHint={accessibilityHint}
			accessibilityState={{ selected: Boolean(selected) }}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				{ backgroundColor: selected || pressed ? colors.bgHover : "transparent" },
			]}
		>
			<View style={[styles.tile, { backgroundColor: colors[tileTone] }]}>
				<Icon name={icon} color={colors[iconTone]} />
			</View>
			<View style={styles.text}>
				<PoText variant="row15" numberOfLines={1}>
					{name}
				</PoText>
				<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
					{status}
				</PoText>
			</View>
			{trailing}
		</Pressable>
	);
}

function SectionLabel({ children }: { children: string }) {
	return (
		<View style={styles.section}>
			<PoText variant="eyebrow11" tone="textTertiary">
				{children}
			</PoText>
		</View>
	);
}

/**
 * Home "Module picker": a scrim plus a floating card. Overview is the current view; enabled
 * modules are listed under "Your modules" and the rest can be added. Module dashboards come
 * later, so choosing an enabled module only closes the picker.
 */
export function ModulePicker({ top, modules, onClose, onAddModule }: ModulePickerProps) {
	const { colors } = usePoTheme();
	const enabled = modules.filter((item) => item.enabled);
	const available = modules.filter((item) => !item.enabled);

	return (
		<View style={StyleSheet.absoluteFill}>
			<Animated.View
				entering={FadeIn.duration(180)}
				exiting={FadeOut.duration(150)}
				style={StyleSheet.absoluteFill}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close modules"
					onPress={onClose}
					style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
				/>
			</Animated.View>
			<Animated.View
				entering={FadeInUp.duration(260)}
				exiting={FadeOut.duration(150)}
				style={[
					styles.card,
					{ top, backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					toShadowStyle(elevation.floating),
				]}
			>
				<ScrollView contentContainerStyle={styles.content} bounces={false}>
					<View style={styles.head}>
						<PoText variant="title18">Modules</PoText>
					</View>
					<SectionLabel>Pinned</SectionLabel>
					<Row
						icon="Filled/Grid"
						iconTone="textPrimary"
						tileTone="bgSubtle"
						name="Overview"
						status="All areas in one view"
						selected
						onPress={onClose}
						trailing={
							<View style={[styles.check, { backgroundColor: colors.bgInverse }]}>
								<Icon name="Line/Check" size={16} color={colors.textInverse} />
							</View>
						}
					/>
					{enabled.length > 0 ? <SectionLabel>Your modules</SectionLabel> : null}
					{enabled.map((item) => (
						<Row key={item.id} {...item} name={item.label} onPress={onClose} />
					))}
					{available.length > 0 ? <SectionLabel>Add a module</SectionLabel> : null}
					{available.map((item) => (
						<Row
							key={item.id}
							{...item}
							name={item.label}
							accessibilityHint={`Adds ${item.label} to your modules`}
							onPress={() => onAddModule(item.id)}
							trailing={
								<View style={[styles.plus, { backgroundColor: colors.bgInverse }]}>
									<Icon name="Filled/Plus" size={14} color={colors.textInverse} />
								</View>
							}
						/>
					))}
				</ScrollView>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		position: "absolute",
		left: 8,
		right: 8,
		maxHeight: 662,
		borderRadius: 32,
		borderWidth: 1,
		overflow: "hidden",
	},
	content: { gap: 6, paddingTop: 18, paddingBottom: 12, paddingHorizontal: 10 },
	head: {
		paddingLeft: 10,
		paddingRight: 4,
		paddingBottom: 6,
		minHeight: 34,
		justifyContent: "center",
	},
	section: { paddingLeft: 10, paddingTop: 8, paddingBottom: 2 },
	row: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 14,
		borderRadius: 30,
	},
	tile: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
	text: { flex: 1, gap: 2 },
	check: {
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
	},
	plus: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});
