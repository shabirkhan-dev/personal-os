import type { TemplateKind } from "@personal-os/domain/templates";
import { TEMPLATE_MODULE_OF } from "@personal-os/domain/templates";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, IconTile, SectionLabel } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { TEMPLATE_FORMATS } from "../lib/template-formats";
import { MODULE_LABELS, type TemplateModule } from "../lib/template-pack";
import { useTemplateStore } from "../lib/template-store";
import { templateRoutes } from "../navigation";
import { pickTemplate } from "../services/share-template";
import { MakeTemplateSheet } from "./make-template-sheet";

const MODULES = [...new Set(TEMPLATE_FORMATS.map((format) => TEMPLATE_MODULE_OF[format.kind]))];

/**
 * Templates: nothing ships with the app. Describe what you want and any AI makes a template file
 * (or your own AI key makes it here); paste or open it, see a preview, and pick what to add.
 */
export function TemplatesScreen({ module }: { module: TemplateModule | null }) {
	const { colors } = usePoTheme();
	const [selected, setSelected] = useState<string | null>(module);
	const [making, setMaking] = useState<TemplateKind | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const open = useTemplateStore((state) => state.open);
	const shown = TEMPLATE_FORMATS.filter(
		(format) => !selected || TEMPLATE_MODULE_OF[format.kind] === selected,
	);

	const openFile = () => {
		setNotice(null);
		pickTemplate()
			.then((result) => {
				if (!result) return;
				if (!result.ok) {
					setNotice(result.reason);
					return;
				}
				templateRoutes.pack(open(result.file).id);
			})
			.catch((error: unknown) => {
				console.error("[templates] could not open the file", error);
				setNotice("That file couldn't be opened. Try again.");
			});
	};

	return (
		<ModuleScreen label="Templates" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={styles.title}>
				<PoText variant="eyebrow11" tone="textTertiary">
					TEMPLATES · MADE BY YOU
				</PoText>
				<PoText variant="title30">Make your own</PoText>
				<PoText variant="body15" tone="textSecondary">
					Nothing comes with the app. Say what you want, and any AI (ChatGPT, Claude, Gemini, or
					your own key right here) makes a template. You see it first and pick what to add.
				</PoText>
			</View>

			<Pressable
				accessibilityRole="button"
				onPress={openFile}
				style={({ pressed }) => [
					styles.card,
					{ backgroundColor: pressed ? colors.bgHover : colors.accentSubtle },
				]}
			>
				<IconTile name="Download" tone="accentDefault" tile="bgSurface" size={48} />
				<View style={styles.flex}>
					<PoText variant="row15">Open a template file</PoText>
					<PoText variant="meta13" tone="textSecondary">
						One an AI made for you, or a friend sent (.posx.json).
					</PoText>
				</View>
			</Pressable>
			{notice ? (
				<PoText variant="meta13" tone="textWarning" style={styles.pad}>
					{notice}
				</PoText>
			) : null}

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.chipsBleed}
				contentContainerStyle={styles.chips}
			>
				<FilterChip label="All" selected={selected === null} onPress={() => setSelected(null)} />
				{MODULES.map((item) => (
					<FilterChip
						key={item}
						label={MODULE_LABELS[item as TemplateModule]}
						selected={selected === item}
						onPress={() => setSelected(item)}
					/>
				))}
			</ScrollView>

			<SectionLabel>What you can make</SectionLabel>
			<View style={[styles.list, { backgroundColor: colors.bgSurface }]}>
				{shown.map((format, index) => (
					<Pressable
						key={format.kind}
						accessibilityRole="button"
						accessibilityLabel={`Make ${format.label}`}
						onPress={() => setMaking(format.kind)}
						style={({ pressed }) => [
							styles.row,
							index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderDefault } : null,
							pressed ? { backgroundColor: colors.bgHover } : null,
						]}
					>
						<IconTile name={format.icon} tone="accentDefault" tile="accentSubtle" size={40} />
						<View style={styles.flex}>
							<PoText variant="row15">{format.label}</PoText>
							<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
								{format.what}
							</PoText>
						</View>
						<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
					</Pressable>
				))}
			</View>

			<View style={[styles.card, styles.share, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="row15">Share yours</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Your recipe, Care routine, training program, tasbih, budget or minimum day can go to a
					friend as a template file: look for "Share as a template" on each of those screens.
				</PoText>
			</View>

			{making ? <MakeTemplateSheet kind={making} onClose={() => setMaking(null)} /> : null}
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0, gap: 4 },
	title: { gap: 8, paddingHorizontal: 4 },
	pad: { paddingHorizontal: 8 },
	chipsBleed: { marginHorizontal: -16, flexGrow: 0 },
	chips: { gap: 8, paddingHorizontal: 16 },
	card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 22 },
	share: { flexDirection: "column", alignItems: "stretch", gap: 6, padding: 16 },
	list: { paddingHorizontal: 12, borderRadius: 22 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
});
