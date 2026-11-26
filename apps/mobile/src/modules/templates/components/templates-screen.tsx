import { textStyles } from "@personal-os/tokens";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useTemplateStore } from "../lib/template-store";
import { templateRoutes } from "../navigation";
import { pickTemplate } from "../services/share-template";

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
	const { server, serverState, loadServer, openImported } = useTemplateStore();
	const [notice, setNotice] = useState<string | null>(null);
	useEffect(() => {
		loadServer().catch((error: unknown) => console.warn("[templates] could not load", error));
	}, [loadServer]);
	const words = query.trim().toLowerCase();
	const fromServer = server.filter(
		(pack) =>
			(!selected || pack.module === selected) &&
			(!words ||
				pack.title.toLowerCase().includes(words) ||
				pack.items.some((item) => item.title.toLowerCase().includes(words))),
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
				templateRoutes.pack(openImported(result.file).id);
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
						A recipe, routine, program, tasbih, budget or minimum day someone sent you.
					</PoText>
				</View>
			</Pressable>
			{notice ? (
				<PoText variant="meta13" tone="textWarning" style={styles.pad}>
					{notice}
				</PoText>
			) : null}

			{shown.length === 0 && fromServer.length === 0 ? (
				<PoText variant="body15" tone="textSecondary" style={styles.pad}>
					No pack matches that yet.
				</PoText>
			) : (
				shown.map((pack) => <PackCard key={pack.id} pack={pack} added={counts[pack.id] ?? 0} />)
			)}

			{fromServer.length > 0 ? (
				<>
					<PoText variant="eyebrow11" tone="textTertiary" style={styles.pad}>
						NEW FROM PERSONAL OS
					</PoText>
					{fromServer.map((pack) => (
						<PackCard key={pack.id} pack={pack} added={0} />
					))}
				</>
			) : serverState === "loading" ? (
				<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
					Looking for new packs…
				</PoText>
			) : null}

			<View style={[styles.share, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="row15">Share yours</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Send a friend your recipe, Care routine, training program, tasbih, budget or minimum day
					as a template: look for "Share as a template" on each of those screens. They open it here
					and add their own copy.
				</PoText>
			</View>
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
	share: { gap: 6, padding: 16, borderRadius: 22 },
});
