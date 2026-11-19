import { textStyles } from "@personal-os/tokens";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip, IconTile } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";
import {
	MODULE_LABELS,
	packsFor,
	TEMPLATE_PACKS,
	type TemplateModule,
	type TemplatePack,
} from "../lib/packs";
import { templateRoutes } from "../navigation";

const inputStyle = toTextStyle(textStyles.body15);
const MODULES = Object.keys(MODULE_LABELS) as TemplateModule[];

/** How many of each pack's items are already added, refreshed whenever the screen shows. */
function useAddedCounts(): Record<string, number> {
	const [counts, setCounts] = useState<Record<string, number>>({});
	useFocusEffect(
		useCallback(() => {
			let live = true;
			Promise.all(TEMPLATE_PACKS.map(async (pack) => [pack.id, (await pack.added()).size] as const))
				.then((entries) => {
					if (live) setCounts(Object.fromEntries(entries));
				})
				.catch((error: unknown) => console.warn("[templates] could not read what's added", error));
			return () => {
				live = false;
			};
		}, []),
	);
	return counts;
}

/**
 * Templates: the marketplace of ready-made packs for every module. The app starts empty; a pack
 * is only added when the person opens it and picks what they want.
 */
export function TemplatesScreen({ module }: { module: TemplateModule | null }) {
	const { colors } = usePoTheme();
	const [selected, setSelected] = useState<TemplateModule | null>(module);
	const [query, setQuery] = useState("");
	const counts = useAddedCounts();
	const shown = packsFor(selected, query);

	return (
		<ModuleScreen label="Templates" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={styles.title}>
				<PoText variant="eyebrow11" tone="textTertiary">
					TEMPLATES · {TEMPLATE_PACKS.length} PACKS
				</PoText>
				<PoText variant="title30">Start from something ready</PoText>
				<PoText variant="body15" tone="textSecondary">
					Your app starts empty. Add a pack when it helps: every item becomes yours to change or
					delete.
				</PoText>
			</View>

			<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Search" size={16} color={colors.textSecondary} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search recipes, programs, routines…"
					placeholderTextColor={colors.textTertiary}
					accessibilityLabel="Search templates"
					style={[inputStyle, styles.flex, { color: colors.textPrimary }]}
				/>
			</View>

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
						label={MODULE_LABELS[item]}
						selected={selected === item}
						onPress={() => setSelected(item)}
					/>
				))}
			</ScrollView>

			{shown.length === 0 ? (
				<PoText variant="body15" tone="textSecondary" style={styles.pad}>
					No pack matches that yet.
				</PoText>
			) : (
				shown.map((pack) => <PackCard key={pack.id} pack={pack} added={counts[pack.id] ?? 0} />)
			)}
		</ModuleScreen>
	);
}

function PackCard({ pack, added }: { pack: TemplatePack; added: number }) {
	const { colors } = usePoTheme();
	const total = pack.items.length;
	const meta =
		pack.choose === "one"
			? `${total} to choose from`
			: pack.choose === "all"
				? `${total} items in one set`
				: `${total} to pick from`;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${pack.title}, ${MODULE_LABELS[pack.module]}`}
			onPress={() => templateRoutes.pack(pack.id)}
			style={({ pressed }) => [
				styles.card,
				{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
			]}
		>
			{pack.cover ? (
				<Image source={pack.cover} resizeMode="cover" style={styles.cover} />
			) : (
				<IconTile name={pack.icon} tone="accentDefault" tile="accentSubtle" size={56} />
			)}
			<View style={styles.flex}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{MODULE_LABELS[pack.module].toUpperCase()}
				</PoText>
				<PoText variant="row15">{pack.title}</PoText>
				<PoText variant="meta13" tone="textSecondary" numberOfLines={2}>
					{pack.summary}
				</PoText>
				<PoText variant="meta13" tone={added > 0 ? "textSuccess" : "textTertiary"}>
					{added > 0 ? `${added} added · ${meta}` : meta}
				</PoText>
			</View>
			<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0, gap: 4 },
	title: { gap: 8, paddingHorizontal: 4 },
	pad: { paddingHorizontal: 8 },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingHorizontal: 16,
		borderRadius: 24,
	},
	chipsBleed: { marginHorizontal: -16, flexGrow: 0 },
	chips: { gap: 8, paddingHorizontal: 16 },
	card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 22 },
	cover: { width: 72, height: 72, borderRadius: 16 },
});
