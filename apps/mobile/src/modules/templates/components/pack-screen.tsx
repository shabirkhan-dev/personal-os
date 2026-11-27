import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { Footer, IconTile } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { MODULE_LABELS, type PackItem, type TemplatePack } from "../lib/template-pack";
import { findPack } from "../lib/template-store";

/**
 * One template pack: what's in it, each item with its details, and a choice of what to add.
 * Items already in the person's data show as added; adding copies the rest in.
 */
export function PackScreen({ id }: { id: string }) {
	const pack = findPack(id);
	if (!pack) {
		return (
			<ModuleScreen label="Templates" tab="profile" onHome={() => router.dismissTo("/")}>
				<PoText variant="body15" tone="textSecondary">
					This pack isn't available any more.
				</PoText>
			</ModuleScreen>
		);
	}
	return <Pack pack={pack} />;
}

function Pack({ pack }: { pack: TemplatePack }) {
	const { colors } = usePoTheme();
	const [added, setAdded] = useState<ReadonlySet<string>>(new Set());
	const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
	const [open, setOpen] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	/** Set once something from this pack was added on this visit (a file can't tell what's added). */
	const [didAdd, setDidAdd] = useState(false);

	const refresh = useCallback(() => {
		pack
			.added()
			.then(setAdded)
			.catch((error: unknown) => console.warn("[templates] could not read what's added", error));
	}, [pack]);
	useFocusEffect(refresh);

	const fresh = pack.items.filter((item) => !added.has(item.id));
	const allAdded = pack.items.length > 0 && fresh.length === 0;
	const toAdd =
		pack.choose === "all"
			? fresh.map((item) => item.id)
			: [...picked].filter((id) => !added.has(id));

	const toggle = (item: PackItem) => {
		if (added.has(item.id) || pack.choose === "all") return;
		haptics.select();
		setPicked((current) => {
			if (pack.choose === "one") return new Set(current.has(item.id) ? [] : [item.id]);
			const next = new Set(current);
			if (next.has(item.id)) next.delete(item.id);
			else next.add(item.id);
			return next;
		});
	};

	const add = () => {
		if (busy || toAdd.length === 0) return;
		setBusy(true);
		setNotice(null);
		pack
			.add(toAdd)
			.then(() => {
				haptics.success();
				setDidAdd(true);
				setPicked(new Set());
				setNotice(
					pack.choose === "one"
						? "Started. It's in your app now."
						: `Added ${toAdd.length} to your app. Change or delete any of them there.`,
				);
				refresh();
			})
			.catch((error: unknown) => {
				console.error(`[templates] could not add ${pack.id}`, error);
				setNotice("Couldn't add them on this phone. Try again.");
			})
			.finally(() => setBusy(false));
	};

	const label =
		pack.choose === "one"
			? "Start this one"
			: pack.choose === "all"
				? allAdded || didAdd
					? "Added to your app"
					: "Add this set"
				: toAdd.length > 0
					? `Add ${toAdd.length} to my app`
					: "Pick what to add";

	return (
		<ModuleScreen label="Templates" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={[styles.hero, { backgroundColor: colors.bgSurface }]}>
				<IconTile name={pack.icon} tone="accentDefault" tile="accentSubtle" size={56} />
				<PoText variant="eyebrow11" tone="textTertiary">
					{`${MODULE_LABELS[pack.module].toUpperCase()} · TEMPLATE`}
				</PoText>
				<PoText variant="title30">{pack.title}</PoText>
				<PoText variant="body15" tone="textSecondary">
					{pack.summary}
				</PoText>
				{pack.author ? (
					<PoText variant="meta13" tone="textTertiary">
						{`Shared by ${pack.author}. Check it before you add it: it becomes your own copy.`}
					</PoText>
				) : null}
				{pack.choose === "pick" && fresh.length > 1 ? (
					<Pressable
						accessibilityRole="button"
						onPress={() =>
							setPicked(
								picked.size === fresh.length ? new Set() : new Set(fresh.map((item) => item.id)),
							)
						}
					>
						<PoText variant="row15" tone="textLink">
							{picked.size === fresh.length ? "Clear the selection" : `Select all ${fresh.length}`}
						</PoText>
					</Pressable>
				) : null}
			</View>

			<View style={[styles.list, { backgroundColor: colors.bgSurface }]}>
				{pack.items.map((item, index) => {
					const isAdded = added.has(item.id);
					const isPicked = picked.has(item.id) || (pack.choose === "all" && !isAdded);
					const expanded = open === item.id;
					return (
						<View
							key={item.id}
							style={[
								styles.item,
								index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderDefault } : null,
							]}
						>
							<Pressable
								accessibilityRole={pack.choose === "all" ? "text" : "checkbox"}
								accessibilityState={{ checked: isAdded || isPicked, disabled: isAdded }}
								onPress={() => toggle(item)}
								style={styles.row}
							>
								<View style={styles.flex}>
									<PoText variant="row15">{item.title}</PoText>
									<PoText variant="meta13" tone="textSecondary" numberOfLines={expanded ? 4 : 2}>
										{item.subtitle}
									</PoText>
								</View>
								{isAdded ? (
									<View style={styles.added}>
										<Icon name="Line/Check" size={14} color={colors.statusSuccess} />
										<PoText variant="meta13" tone="textSuccess">
											Added
										</PoText>
									</View>
								) : pack.choose === "all" ? null : (
									<Checkbox checked={isPicked} />
								)}
							</Pressable>
							{item.detail?.length ? (
								<Pressable
									accessibilityRole="button"
									onPress={() => setOpen(expanded ? null : item.id)}
									style={styles.more}
								>
									<PoText variant="meta13" tone="textLink">
										{expanded ? "Hide details" : "Details"}
									</PoText>
								</Pressable>
							) : null}
							{expanded
								? item.detail?.map((line) => (
										<PoText key={line} variant="meta13" tone="textSecondary" style={styles.detail}>
											{line}
										</PoText>
									))
								: null}
						</View>
					);
				})}
			</View>

			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			<Footer>
				{added.size > 0 || didAdd ? (
					<PillButton
						label="Open"
						variant="secondary"
						style={styles.button}
						onPress={() => router.push(pack.open as Parameters<typeof router.push>[0])}
					/>
				) : null}
				<PillButton
					label={busy ? "Adding…" : label}
					disabled={busy || toAdd.length === 0 || (pack.choose === "all" && didAdd)}
					style={styles.button}
					onPress={add}
				/>
			</Footer>
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0, gap: 2 },
	pad: { paddingHorizontal: 8 },
	hero: { gap: 10, padding: 20, borderRadius: 24 },
	list: { paddingHorizontal: 16, borderRadius: 22 },
	item: { paddingVertical: 12, gap: 6 },
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	added: { flexDirection: "row", alignItems: "center", gap: 4 },
	more: { alignSelf: "flex-start" },
	detail: { paddingLeft: 4 },
	button: { flex: 1, minWidth: 0 },
});
