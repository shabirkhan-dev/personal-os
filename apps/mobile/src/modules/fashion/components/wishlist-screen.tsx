import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import { formatMoney, parseAmount } from "@/lib/money";
import { usePoTheme } from "@/theme";
import { buyWish, removeWish, saveSettings, saveWish } from "../data/fashion-actions";
import { useFashion } from "../hooks/use-fashion";
import { lookAlike } from "../lib/catalog";
import { goesWith } from "../lib/fashion-math";
import {
	CATEGORIES,
	CATEGORY_ONE,
	type Wish,
	WISH_TAG_LABELS,
	WISH_TAGS,
} from "../lib/fashion-model";
import { guessCategory, guessColour } from "../lib/parse-fashion-line";
import { fashionRoutes } from "../navigation";
import { FashionScreen } from "./fashion-screen";
import { PieceImage } from "./piece-image";

const TAG_TONE = {
	first: { bg: "accentSubtle", fg: "accentDefault" },
	replace: { bg: "statusSuccessSubtle", fg: "textSuccess" },
	someday: { bg: "bgSubtle", fg: "textSecondary" },
} as const;

/** "Bought it": the wish moves into the wardrobe and opens there. */
function bought(wish: Wish): void {
	Alert.alert(`Bought ${wish.name}?`, "It moves into your wardrobe.", [
		{ text: "Not yet", style: "cancel" },
		{
			text: "Bought it",
			onPress: () =>
				void buyWish(wish)
					.then((piece) => {
						haptics.success();
						fashionRoutes.piece(piece.id);
					})
					.catch((error: unknown) => console.error("[fashion] could not move it", error)),
		},
	]);
}

/** Wishlist: what to buy next and why, on hold while buying is paused. */
export function WishlistScreen() {
	const { colors } = usePoTheme();
	const { wishes, pieces, settings } = useFashion();
	const [editing, setEditing] = useState<{ key: number; wish: Wish | null } | null>(null);
	const total = wishes.reduce((sum, wish) => sum + (wish.price ?? 0), 0);
	const edit = (wish: Wish | null) =>
		setEditing((current) => ({ key: (current?.key ?? 0) + 1, wish }));

	const toggleHold = (paused: boolean) =>
		void saveSettings({ ...settings, buyingPaused: paused }).catch((error: unknown) =>
			console.error("[fashion] could not save", error),
		);

	return (
		<FashionScreen
			action={{ icon: "Line/Plus", label: "Add to wishlist", onPress: () => edit(null) }}
		>
			<ScreenTitle eyebrow={`${wishes.length} items · ${formatMoney(total)}`} title="Wishlist" />

			<View
				style={[
					styles.hold,
					{
						backgroundColor: settings.buyingPaused ? colors.statusCautionSubtle : colors.bgSurface,
						borderColor: settings.buyingPaused ? colors.statusCaution : colors.borderDefault,
					},
				]}
			>
				<View style={styles.flex}>
					<PoText variant="row15" tone={settings.buyingPaused ? "statusCaution" : "textPrimary"}>
						{settings.buyingPaused ? "Buying paused until the new job" : "Buying is open"}
					</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{settings.buyingPaused
							? settings.pauseNote
							: "Pause it to keep the runway safe; items wait here."}
					</PoText>
				</View>
				<Toggle
					value={settings.buyingPaused}
					onChange={toggleHold}
					accessibilityLabel="Pause buying"
				/>
			</View>

			{wishes.map((wish) => {
				const tone = TAG_TONE[wish.tag];
				const pairs = goesWith(wish, pieces).length;
				return (
					<Pressable
						key={wish.id}
						accessibilityRole="button"
						onPress={() => edit(wish)}
						style={[
							styles.card,
							{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
						]}
					>
						<View style={styles.head}>
							<PieceImage
								image={wish.image}
								category={wish.category}
								colour={wish.colour}
								size={78}
								radius={18}
							/>
							<View style={styles.flex}>
								<View style={[styles.tag, { backgroundColor: colors[tone.bg] }]}>
									<PoText variant="meta13" tone={tone.fg}>
										{WISH_TAG_LABELS[wish.tag]}
									</PoText>
								</View>
								<PoText variant="title18">{wish.name}</PoText>
								<PoText variant="mono13" tone="textSecondary">
									{wish.price !== null ? formatMoney(wish.price) : "No price yet"}
								</PoText>
							</View>
						</View>
						{wish.reason || pairs > 0 ? (
							<PoText variant="text14" tone="textSecondary">
								{[wish.reason, pairs > 0 ? `Goes with ${pairs} pieces you own.` : ""]
									.filter(Boolean)
									.join(" ")}
							</PoText>
						) : null}
						<View style={styles.foot}>
							<View style={[styles.dot, { backgroundColor: colors[tone.fg] }]} />
							<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
								{wish.unlock ||
									(settings.buyingPaused ? "Waits until buying opens" : "Can buy any time")}
							</PoText>
							{settings.buyingPaused ? null : (
								<Pressable accessibilityRole="button" hitSlop={8} onPress={() => bought(wish)}>
									<PoText variant="meta13" tone="accentDefault">
										Bought it
									</PoText>
								</Pressable>
							)}
						</View>
					</Pressable>
				);
			})}

			<Pressable
				accessibilityRole="button"
				onPress={() => edit(null)}
				style={[styles.add, { borderColor: colors.borderDefault }]}
			>
				<Icon name="Line/Plus" size={16} color={colors.textSecondary} />
				<PoText variant="meta13" tone="textSecondary">
					Add by name or link
				</PoText>
			</Pressable>

			{editing ? (
				<WishSheet key={editing.key} wish={editing.wish} onClose={() => setEditing(null)} />
			) : null}
		</FashionScreen>
	);
}

function WishSheet({ wish, onClose }: { wish: Wish | null; onClose: () => void }) {
	const [name, setName] = useState(wish?.name ?? "");
	const [price, setPrice] = useState(
		wish?.price !== null && wish?.price !== undefined ? String(wish.price) : "",
	);
	const [tag, setTag] = useState<Wish["tag"]>(wish?.tag ?? "someday");
	const [reason, setReason] = useState(wish?.reason ?? "");
	const [unlock, setUnlock] = useState(wish?.unlock ?? "");
	const [url, setUrl] = useState(wish?.url ?? "");
	const [category, setCategory] = useState<Wish["category"] | null>(wish?.category ?? null);
	const parsed = price.trim() ? parseAmount(price) : null;
	const guessed = category ?? guessCategory(name) ?? "extra";
	const colour = wish?.colour ?? guessColour(name) ?? "other";
	const canSave = name.trim().length > 0 && (!price.trim() || parsed !== null);

	const save = () => {
		void saveWish({
			...(wish ? { id: wish.id, createdAt: wish.createdAt } : {}),
			name: name.trim(),
			category: guessed,
			colour,
			price: parsed,
			tag,
			reason: reason.trim(),
			unlock: unlock.trim(),
			image:
				wish?.image ??
				(lookAlike(guessed, colour) ? `catalog:${lookAlike(guessed, colour)?.id}` : null),
			url: url.trim(),
		}).catch((error: unknown) => console.error("[fashion] could not save the wish", error));
		onClose();
	};

	return (
		<Sheet
			visible
			title={wish ? "Edit wish" : "Add to wishlist"}
			onClose={onClose}
			footer={
				<View style={styles.sheetFoot}>
					{wish ? (
						<PillButton
							label="Remove"
							variant="secondary"
							onPress={() => {
								void removeWish(wish).catch((error: unknown) =>
									console.error("[fashion] could not remove", error),
								);
								onClose();
							}}
							style={styles.flex}
						/>
					) : null}
					<PillButton label="Save" disabled={!canSave} onPress={save} style={styles.flex} />
				</View>
			}
		>
			<TextField label="What" value={name} onChangeText={setName} placeholder="Navy blazer" />
			<TextField
				label="Price"
				value={price}
				onChangeText={setPrice}
				keyboardType="numeric"
				suffix="Rs"
			/>
			<ChoiceChips
				label="Priority"
				options={WISH_TAGS.map((value) => ({ value, label: WISH_TAG_LABELS[value] }))}
				value={tag}
				onChange={setTag}
			/>
			<ChoiceChips
				label="Kind"
				options={CATEGORIES.map((value) => ({ value, label: CATEGORY_ONE[value] }))}
				value={guessed}
				onChange={setCategory}
			/>
			<TextField
				label="Why"
				value={reason}
				onChangeText={setReason}
				placeholder="Interviews and events"
			/>
			<TextField
				label="When"
				value={unlock}
				onChangeText={setUnlock}
				placeholder="Unlocks with first salary"
			/>
			<TextField
				label="Link (optional)"
				value={url}
				onChangeText={setUrl}
				placeholder="https://…"
				keyboardType="url"
			/>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	hold: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 16,
		borderRadius: 24,
		borderWidth: 1,
	},
	card: { gap: 12, padding: 16, borderRadius: 28, borderWidth: 1 },
	head: { flexDirection: "row", alignItems: "center", gap: 14 },
	tag: {
		alignSelf: "flex-start",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 10,
		marginBottom: 4,
	},
	foot: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	add: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 52,
		borderRadius: 26,
		borderWidth: 1,
		borderStyle: "dashed",
	},
	sheetFoot: { flexDirection: "row", gap: 8 },
});
