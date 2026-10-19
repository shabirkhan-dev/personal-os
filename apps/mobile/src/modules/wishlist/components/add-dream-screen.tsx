import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Footer, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { FieldGroup, FieldRow, TextBox } from "@/modules/career/components/field-rows";
import { toTextStyle, usePoTheme } from "@/theme";
import { addDream, saveChecklist, saveDream } from "../data/wishlist-actions";
import { useWishlist } from "../hooks/use-wishlist";
import { useWishlistUi } from "../hooks/wishlist-ui-store";
import { parseWishLine } from "../lib/parse-wish-line";
import { compactMoney, fullMoney, replacedPhotoUri } from "../lib/wishlist-math";
import {
	CATEGORY_LABELS,
	DREAM_CATEGORIES,
	type DreamCategory,
	type Photo,
	type Spec,
} from "../lib/wishlist-model";
import { wishlistRoutes } from "../navigation";
import { deleteDreamPhoto, pickDreamPhoto } from "../services/dream-photo";
import { type DreamFound, useWishlistAi, wishlistAiMessage } from "../services/wishlist-ai";
import { DreamImage } from "./dream-image";
import { WishlistScreen } from "./wishlist-screen";

const inputStyle = toTextStyle(textStyles.body15);

type Form = {
	name: string;
	category: DreamCategory;
	price: string;
	why: string;
	photo: Photo;
	paysForItself: boolean;
	priceLow: number | null;
	priceHigh: number | null;
	fits: string;
	specs: string;
	checklist: string;
};

const EMPTY: Form = {
	name: "",
	category: "other",
	price: "",
	why: "",
	photo: null,
	paysForItself: false,
	priceLow: null,
	priceHigh: null,
	fits: "",
	specs: "",
	checklist: "",
};

/** "Screen: 16 inch" lines ↔ specs. */
function specsFrom(text: string): Spec[] {
	return text
		.split("\n")
		.map((line) => line.split(/:\s*/))
		.filter((parts) => parts.length >= 2 && parts[0]?.trim() && parts.slice(1).join(":").trim())
		.map((parts) => ({
			label: (parts[0] ?? "").trim().slice(0, 30),
			value: parts.slice(1).join(":").trim().slice(0, 40),
		}))
		.slice(0, 10);
}

/** "What do you want?": type a line, pick the closest version, say why, add it to the list. */
export function AddDreamScreen({ editId }: { editId?: string }) {
	const { colors } = usePoTheme();
	const { dreams, owned, loading } = useWishlist();
	const ai = useWishlistAi();
	const editing = editId ? dreams.find((dream) => dream.id === editId) : undefined;
	const draft = useWishlistUi((state) => state.draft);
	const setDraft = useWishlistUi((state) => state.setDraft);
	const [text, setText] = useState("");
	const [form, setForm] = useState<Form>(EMPTY);
	const [found, setFound] = useState<DreamFound | null>(null);
	const [picked, setPicked] = useState<number | null>(null);
	const [looking, setLooking] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const loaded = useRef(false);

	const set = <Key extends keyof Form>(key: Key, value: Form[Key]) =>
		setForm((current) => ({ ...current, [key]: value }));

	// The dream being edited arrives with the record store; fill the form once.
	useEffect(() => {
		if (loaded.current || !editing) return;
		loaded.current = true;
		setForm({
			name: editing.name,
			category: editing.category,
			price: editing.price > 0 ? String(editing.price) : "",
			why: editing.notes,
			photo: editing.photo,
			paysForItself: editing.paysForItself,
			priceLow: editing.priceLow,
			priceHigh: editing.priceHigh,
			fits: "",
			specs: editing.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n"),
			checklist: editing.checklist.map((item) => item.label).join("\n"),
		});
	}, [editing]);

	// A line from the ask bar or an empty-state tile is used once.
	useEffect(() => {
		if (!draft || editId) return;
		setDraft(null);
		setText(draft.name ? draft.text : "");
		setForm((current) => ({
			...current,
			name: draft.name,
			category: draft.category,
			price: draft.price ? String(draft.price) : "",
			why: draft.why,
		}));
		if (draft.name && ai.available) void lookUp(draft.text);
		// oxlint-disable-next-line react/exhaustive-deps -- only the first draft matters
	}, []);

	/** Reads the typed line on the phone, then asks the AI for versions and prices. */
	async function lookUp(value = text) {
		const line = value.trim();
		if (!line) return;
		const local = parseWishLine(line);
		setForm((current) => ({
			...current,
			name: current.name || local.name,
			category: current.category === "other" ? local.category : current.category,
			price: current.price || (local.price ? String(local.price) : ""),
			why: current.why || local.why,
		}));
		if (!ai.available) {
			setMessage("Sign in to look up prices. Add the price yourself below.");
			return;
		}
		setLooking(true);
		setMessage(null);
		try {
			const result = await ai.find(line);
			setFound(result);
			setPicked(result.options.length > 0 ? 0 : null);
			setForm((current) => ({
				...current,
				name: result.name || current.name,
				category: result.category === "other" ? current.category : result.category,
				price: result.options[0]
					? String(result.options[0].price)
					: current.price || (result.priceLow ? String(result.priceLow) : ""),
				priceLow: result.priceLow || null,
				priceHigh: result.priceHigh || null,
				fits: result.fits,
			}));
			haptics.success();
		} catch (error) {
			setMessage(wishlistAiMessage(error));
		} finally {
			setLooking(false);
		}
	}

	const photo = async (source: "camera" | "library") => {
		const result = await pickDreamPhoto(source);
		if (result.status === "picked") set("photo", { kind: "file", uri: result.uri });
		else if (result.status === "denied")
			setMessage(
				`Allow ${source === "camera" ? "the camera" : "photos"} for Personal OS in Settings.`,
			);
		else if (result.status === "unavailable") setMessage("Couldn't get that photo. Try again.");
	};

	const price = parseAmount(form.price);
	const canSave =
		form.name.trim().length > 0 && price !== null && form.why.trim().length > 0 && !saving;

	const save = async () => {
		if (price === null) return;
		setSaving(true);
		try {
			const specs = specsFrom(form.specs);
			if (editing) {
				const next = {
					...editing,
					name: form.name.trim().slice(0, 80),
					category: form.category,
					price,
					notes: form.why.trim().slice(0, 400),
					photo: form.photo,
					paysForItself: form.paysForItself,
					priceLow: form.priceLow,
					priceHigh: form.priceHigh,
					specs,
				};
				await saveDream(next);
				await saveChecklist(next, form.checklist.split("\n"));
				const replaced = replacedPhotoUri(editing.photo, next.photo, owned);
				if (replaced) deleteDreamPhoto(replaced);
				haptics.success();
				router.back();
				return;
			}
			const dream = await addDream(
				{
					name: form.name,
					price,
					category: form.category,
					notes: form.why,
					photo: form.photo,
					paysForItself: form.paysForItself,
					priceLow: form.priceLow,
					priceHigh: form.priceHigh,
					specs,
				},
				dreams,
			);
			haptics.success();
			router.back();
			wishlistRoutes.dream(dream.id);
		} catch (error) {
			console.error("[wishlist] could not save the dream", error);
			setMessage("Couldn't save on this phone. Try again.");
		} finally {
			setSaving(false);
		}
	};

	if (editId && !editing) {
		return (
			<WishlistScreen>
				{loading ? (
					<ActivityIndicator color={colors.accentDefault} />
				) : (
					<PoText variant="body15" tone="textSecondary">
						This dream isn't on your list any more.
					</PoText>
				)}
			</WishlistScreen>
		);
	}

	const status = looking
		? "Looking up versions and the price in Pakistan…"
		: found
			? found.options.length > 0
				? `Found ${found.options.length} ${found.options.length === 1 ? "option" : "options"} and the price in Pakistan`
				: "Couldn't find versions; add the price yourself"
			: message;

	return (
		<WishlistScreen>
			<ScreenTitle
				eyebrow={editing ? "Edit dream" : "New dream · AI finds the rest"}
				title={editing ? editing.name : "What do you want?"}
			/>

			{editing ? null : (
				<View
					style={[
						styles.input,
						{
							backgroundColor: colors.bgSurface,
							borderColor: text ? colors.accentDefault : colors.borderDefault,
						},
					]}
				>
					<TextInput
						value={text}
						onChangeText={setText}
						onSubmitEditing={() => void lookUp()}
						onBlur={() => {
							if (text.trim() && !found && !looking) void lookUp();
						}}
						placeholder="a GPS sports watch for running and boxing"
						placeholderTextColor={colors.textTertiary}
						returnKeyType="search"
						accessibilityLabel="What do you want?"
						selectionColor={colors.accentDefault}
						style={[inputStyle, { color: colors.textPrimary }]}
					/>
					{status ? (
						<View style={styles.status}>
							{looking ? (
								<ActivityIndicator size="small" color={colors.accentDefault} />
							) : (
								<View
									style={[
										styles.dot,
										{ backgroundColor: found ? colors.statusSuccess : colors.textTertiary },
									]}
								/>
							)}
							<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
								{status}
							</PoText>
						</View>
					) : null}
				</View>
			)}

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<View style={styles.head}>
					<PoText variant="title18" style={styles.flex}>
						{found && found.options.length > 0 ? "Pick the closest" : "Photo"}
					</PoText>
					<Pressable accessibilityRole="button" hitSlop={8} onPress={() => void photo("library")}>
						<PoText variant="mono13" tone="textTertiary">
							or upload
						</PoText>
					</Pressable>
				</View>
				{found && found.options.length > 0 ? (
					<View style={styles.options}>
						{found.options.map((option, index) => {
							const selected = picked === index;
							return (
								<Pressable
									key={option.label}
									accessibilityRole="radio"
									accessibilityState={{ selected }}
									accessibilityLabel={`${option.label}, ${fullMoney(option.price)}`}
									onPress={() => {
										haptics.select();
										setPicked(index);
										set("price", String(option.price));
									}}
									style={styles.option}
								>
									<View
										style={[
											styles.optionImage,
											{ borderColor: selected ? colors.accentDefault : colors.bgSurface },
										]}
									>
										<DreamImage
											photo={form.photo}
											category={form.category}
											height={94}
											radius={14}
										/>
									</View>
									<PoText variant="row15">{option.label}</PoText>
									<PoText variant="mono13" tone={selected ? "accentDefault" : "textTertiary"}>
										{compactMoney(option.price)}
									</PoText>
								</Pressable>
							);
						})}
					</View>
				) : (
					<DreamImage photo={form.photo} category={form.category} height={150} radius={18} />
				)}
				<View style={styles.row}>
					<PillButton
						variant="secondary"
						label="Take photo"
						style={styles.flex}
						onPress={() => void photo("camera")}
					/>
					<PillButton
						variant="secondary"
						label="From library"
						style={styles.flex}
						onPress={() => void photo("library")}
					/>
				</View>
			</View>

			<FieldGroup>
				<FieldRow label="Name" value={form.name} onChangeText={(value) => set("name", value)} />
				<FieldRow
					label="Price"
					value={form.price}
					onChangeText={(value) => {
						set("price", value);
						setPicked(null);
					}}
					placeholder="Rs"
					keyboardType="decimal-pad"
				/>
				<FieldRow
					label="Price range"
					value={
						form.priceLow && form.priceHigh
							? `${compactMoney(form.priceLow)} to ${compactMoney(form.priceHigh).replace("Rs ", "")}`
							: ""
					}
					onChangeText={() => undefined}
					placeholder="—"
					editable={false}
				/>
				<FieldRow
					label="Fits"
					value={form.fits}
					onChangeText={(value) => set("fits", value)}
					placeholder="What it's for"
					last
				/>
			</FieldGroup>
			<ChoiceChips
				label="Category"
				options={DREAM_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
				value={form.category}
				onChange={(value) => set("category", value)}
			/>
			<View style={styles.toggleRow}>
				<View style={styles.flex}>
					<PoText variant="row15">Pays for itself</PoText>
					<PoText variant="meta13" tone="textSecondary">
						A work tool that earns its price back
					</PoText>
				</View>
				<Toggle
					value={form.paysForItself}
					onChange={(value) => set("paysForItself", value)}
					accessibilityLabel="Pays for itself"
				/>
			</View>

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Why do you want it?
				</PoText>
				<TextBox
					label="Why do you want it?"
					value={form.why}
					onChangeText={(value) => set("why", value)}
					placeholder="Track pace and heart rate without carrying the phone"
					minHeight={68}
				/>
				<PoText variant="meta13" tone={form.why.trim() ? "textTertiary" : "textWarning"}>
					Required. A dream with a reason is easier to wait for.
				</PoText>
			</View>

			{editing ? (
				<>
					<SectionLabel>Before you buy · one per line</SectionLabel>
					<TextBox
						label="Before you buy, one per line"
						value={form.checklist}
						onChangeText={(value) => set("checklist", value)}
						placeholder={"Test ride two bikes\nRiding gear budgeted"}
						minHeight={90}
					/>
					<SectionLabel>Specs for Compare · label: value</SectionLabel>
					<TextBox
						label="Specs for Compare, one per line"
						value={form.specs}
						onChangeText={(value) => set("specs", value)}
						placeholder={"Screen: 16 inch\nMemory: 32 GB"}
						minHeight={90}
					/>
				</>
			) : null}

			{message && (found || editing) ? (
				<PoText variant="meta13" tone="textDanger">
					{message}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					variant="secondary"
					label="Cancel"
					style={styles.flex}
					onPress={() => router.back()}
				/>
				<PillButton
					label={editing ? "Save" : "Add to list"}
					style={styles.flex}
					disabled={!canSave}
					onPress={() => void save()}
				/>
			</Footer>
		</WishlistScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	input: { gap: 10, padding: 15, borderRadius: 24, borderWidth: 1 },
	status: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	card: { gap: 12, padding: 16, borderRadius: 28 },
	head: { flexDirection: "row", alignItems: "center" },
	options: { flexDirection: "row", gap: 10 },
	option: { flex: 1, gap: 4 },
	optionImage: { borderRadius: 16, borderWidth: 2, padding: 2 },
	row: { flexDirection: "row", gap: 10 },
	toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 },
});
