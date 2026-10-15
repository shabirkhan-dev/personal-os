import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/icons";
import { Footer, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { toTextStyle, usePoTheme } from "@/theme";
import { deletePiece, savePiece } from "../data/fashion-actions";
import { useFashionUi } from "../hooks/fashion-ui-store";
import { useFashion } from "../hooks/use-fashion";
import { CATALOG } from "../lib/catalog";
import { capital } from "../lib/fashion-math";
import {
	CATEGORIES,
	CATEGORY_ONE,
	type Category,
	type Colour,
	COLOURS,
	type Piece,
	SCENT_TIMES,
	type ScentTime,
} from "../lib/fashion-model";
import { filledCount, guessColour, guessPiece } from "../lib/parse-fashion-line";
import { fashionAiMessage, useFashionAi } from "../services/fashion-ai";
import { piecePhoto } from "../services/piece-photo";
import { FashionScreen } from "./fashion-screen";
import { PieceImage, Swatch } from "./piece-image";

const inputStyle = toTextStyle(textStyles.body15);
const LINK = /^https?:\/\/\S+$/i;

type Form = {
	name: string;
	category: Category | null;
	colour: Colour | null;
	image: string | null;
	size: string;
	fit: string;
	fabric: string;
	price: string;
	boughtOn: string;
	care: string;
	note: string;
	scentTime: ScentTime;
	level: number;
};

function formFrom(piece: Piece | undefined, category: Category | null): Form {
	return {
		name: piece?.name ?? "",
		category: piece?.category ?? category,
		colour: piece?.colour ?? null,
		image: piece?.image ?? null,
		size: piece?.size ?? "",
		fit: piece?.fit ?? "",
		fabric: piece?.fabric ?? "",
		price: piece?.price !== null && piece?.price !== undefined ? String(piece.price) : "",
		boughtOn: piece ? (piece.boughtOn ?? "") : dayKey(new Date()),
		care: piece?.care ?? "",
		note: piece?.note ?? "",
		scentTime: piece?.scentTime ?? "day",
		level: piece?.level ?? 1,
	};
}

/** "What did you get?": type a line or paste a link and the fields fill in; a photo, then save. */
export function AddPieceScreen({ editId, category }: { editId?: string; category?: string }) {
	const { colors } = usePoTheme();
	const { pieces, loading } = useFashion();
	const ai = useFashionAi();
	const editing = editId ? pieces.find((piece) => piece.id === editId) : undefined;
	const draft = useFashionUi((state) => state.draft);
	const setDraft = useFashionUi((state) => state.setDraft);
	const startCategory = (CATEGORIES as readonly string[]).includes(category ?? "")
		? (category as Category)
		: null;
	const [text, setText] = useState(draft);
	const [form, setForm] = useState<Form>(() => formFrom(editing, startCategory));
	const [touched, setTouched] = useState<ReadonlySet<keyof Form>>(new Set());
	const [filled, setFilled] = useState(0);
	const [reading, setReading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const loaded = useRef(Boolean(editing));

	// The piece being edited arrives with the record store; fill the form once.
	useEffect(() => {
		if (loaded.current || !editing) return;
		loaded.current = true;
		setForm(formFrom(editing, startCategory));
	}, [editing, startCategory]);

	// Text handed over from the ask bar is used once.
	useEffect(() => {
		if (!draft) return;
		setDraft("");
		applyText(draft);
		// oxlint-disable-next-line react/exhaustive-deps -- only the first draft matters
	}, []);

	const set = <Key extends keyof Form>(key: Key, value: Form[Key]) => {
		setForm((current) => ({ ...current, [key]: value }));
		setTouched((current) => new Set([...current, key]));
	};

	/** Fills the fields the person hasn't set themselves from what they typed. */
	function applyText(value: string) {
		setText(value);
		if (LINK.test(value.trim())) {
			setFilled(0);
			return;
		}
		const guess = guessPiece(value);
		setFilled(filledCount(guess));
		setForm((current) => {
			return {
				...current,
				name: touched.has("name") ? current.name : guess.name || current.name,
				category: touched.has("category") ? current.category : (guess.category ?? current.category),
				colour: touched.has("colour") ? current.colour : (guess.colour ?? current.colour),
				size: touched.has("size") ? current.size : guess.size || current.size,
				fit: touched.has("fit") ? current.fit : guess.fit || current.fit,
				fabric: touched.has("fabric") ? current.fabric : guess.fabric || current.fabric,
				price: touched.has("price")
					? current.price
					: guess.price !== null
						? String(guess.price)
						: current.price,
				care: touched.has("care") ? current.care : guess.care || current.care,
			};
		});
	}

	const readLink = async () => {
		setReading(true);
		setMessage(null);
		try {
			const details = await ai.readPiece({ url: text.trim() });
			setForm((current) => ({
				...current,
				name: details.name || current.name,
				category: details.category,
				colour: guessColour(details.colour) ?? current.colour,
				size: details.size || current.size,
				fit: details.fit || current.fit,
				fabric: details.fabric || current.fabric,
				price: details.price !== null ? String(details.price) : current.price,
				care: details.care || current.care,
				image: details.imageUrl ?? current.image,
			}));
			setFilled(6);
			haptics.success();
		} catch (error) {
			setMessage(fashionAiMessage(error));
		} finally {
			setReading(false);
		}
	};

	const photo = async (source: "camera" | "library") => {
		const result = await piecePhoto(source);
		if (result.status === "ok") set("image", result.uri);
		else if (result.status === "denied")
			setMessage(
				`Allow ${source === "camera" ? "the camera" : "photos"} for Personal OS in Settings.`,
			);
		else if (result.status === "error") setMessage("Couldn't get that photo. Try again.");
	};

	const price = form.price.trim() ? parseAmount(form.price) : null;
	const priceOk = !form.price.trim() || price !== null;
	const dateOk = !form.boughtOn.trim() || /^\d{4}-\d{2}-\d{2}$/.test(form.boughtOn.trim());
	const canSave = form.name.trim().length > 0 && form.category !== null && priceOk && dateOk;

	const save = async () => {
		if (!form.category) return;
		try {
			const saved = await savePiece({
				...(editing ? { id: editing.id, createdAt: editing.createdAt } : {}),
				name: form.name,
				category: form.category,
				colour: form.colour ?? "other",
				image: form.image,
				size: form.size.trim(),
				fit: form.fit.trim(),
				fabric: form.fabric.trim(),
				price,
				boughtOn: form.boughtOn.trim() || null,
				care: form.care.trim(),
				note: form.note.trim(),
				level: form.category === "scent" ? form.level : null,
				scentTime: form.category === "scent" ? form.scentTime : null,
			});
			haptics.success();
			if (editing) router.back();
			else router.replace({ pathname: "/fashion/piece/[id]", params: { id: saved.id } });
		} catch (error) {
			console.error("[fashion] could not save the piece", error);
			setMessage("Couldn't save on this phone. Try again.");
		}
	};

	const remove = () => {
		if (!editing) return;
		Alert.alert(
			`Remove ${editing.name}?`,
			"It leaves your wardrobe. Outfits already logged stay.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: () =>
						void deletePiece(editing)
							.then(() => router.dismissTo("/fashion/wardrobe"))
							.catch((error: unknown) => console.error("[fashion] could not remove", error)),
				},
			],
		);
	};

	const lookAlikes = CATALOG.filter((item) => !form.category || item.category === form.category);
	const isLink = LINK.test(text.trim());

	if (editId && !editing && loading) {
		return (
			<FashionScreen>
				<ActivityIndicator color={colors.accentDefault} />
			</FashionScreen>
		);
	}

	return (
		<FashionScreen>
			<ScreenTitle
				eyebrow={editing ? "Edit piece" : "New piece · AI fills the rest"}
				title={editing ? editing.name : "What did you get?"}
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
						onChangeText={applyText}
						placeholder="olive overshirt, cotton twill, size M, 6500"
						placeholderTextColor={colors.textTertiary}
						multiline
						style={[inputStyle, { color: colors.textPrimary }]}
					/>
					{reading ? (
						<View style={styles.status}>
							<ActivityIndicator size="small" color={colors.accentDefault} />
							<PoText variant="meta13" tone="textSecondary">
								Reading the page…
							</PoText>
						</View>
					) : isLink ? (
						<View style={styles.status}>
							<PillButton
								label={ai.available ? "Read the link" : "Sign in to read links"}
								variant="secondary"
								disabled={!ai.available}
								onPress={() => void readLink()}
							/>
						</View>
					) : (
						<View style={styles.status}>
							<View
								style={[
									styles.dot,
									{ backgroundColor: filled > 0 ? colors.statusSuccess : colors.borderStrong },
								]}
							/>
							<PoText variant="meta13" tone="textSecondary">
								{filled > 0
									? `Filled ${filled} field${filled === 1 ? "" : "s"} from your text · or paste a link`
									: "Type it like a note, or paste a product link"}
							</PoText>
						</View>
					)}
				</View>
			)}
			{message ? (
				<PoText variant="meta13" tone="textDanger" style={styles.pad}>
					{message}
				</PoText>
			) : null}

			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<PoText variant="title18">Product image</PoText>
				<View style={styles.imageRow}>
					<View
						style={[
							styles.current,
							{ borderColor: form.image ? colors.accentDefault : colors.borderDefault },
						]}
					>
						<PieceImage
							image={form.image}
							category={form.category ?? "top"}
							colour={form.colour ?? "other"}
							size={0}
							fill
							radius={18}
						/>
					</View>
					<View style={styles.sources}>
						<SourceButton
							icon="Line/Plus"
							title="Upload"
							detail="From gallery"
							onPress={() => void photo("library")}
						/>
						<SourceButton
							icon="Filled/Camera"
							title="Take photo"
							detail="On a plain wall"
							onPress={() => void photo("camera")}
						/>
					</View>
				</View>
				<PoText variant="eyebrow11" tone="textTertiary">
					Or a look-alike
				</PoText>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.alikes}
				>
					{lookAlikes.map((item) => {
						const value = `catalog:${item.id}`;
						const on = form.image === value;
						return (
							<Pressable
								key={item.id}
								accessibilityRole="radio"
								accessibilityLabel={item.name}
								accessibilityState={{ selected: on }}
								onPress={() => {
									haptics.select();
									set("image", value);
									if (!touched.has("colour") && !form.colour) set("colour", item.colour);
								}}
								style={[styles.alike, { borderColor: on ? colors.accentDefault : "transparent" }]}
							>
								<PieceImage
									image={value}
									category={item.category}
									colour={item.colour}
									size={64}
									radius={14}
								/>
							</Pressable>
						);
					})}
				</ScrollView>
			</View>

			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<SectionLabel>Category</SectionLabel>
				<ChoiceChips
					options={CATEGORIES.map((value) => ({ value, label: CATEGORY_ONE[value] }))}
					value={form.category}
					onChange={(value) => set("category", value)}
				/>
				<SectionLabel>Colour</SectionLabel>
				<View style={styles.colours}>
					{COLOURS.filter((colour) => colour !== "other").map((colour) => {
						const on = form.colour === colour;
						return (
							<Pressable
								key={colour}
								accessibilityRole="radio"
								accessibilityState={{ selected: on }}
								onPress={() => {
									haptics.select();
									set("colour", colour);
								}}
								style={[
									styles.colour,
									on
										? { backgroundColor: colors.accentSubtle, borderColor: colors.accentDefault }
										: { backgroundColor: colors.bgSubtle, borderColor: colors.bgSubtle },
								]}
							>
								<Swatch colour={colour} size={12} />
								<PoText variant="meta13" tone={on ? "accentDefault" : "textSecondary"}>
									{capital(colour)}
								</PoText>
							</Pressable>
						);
					})}
				</View>
			</View>

			<View
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<TextField
					label="Name"
					value={form.name}
					onChangeText={(value) => set("name", value)}
					placeholder="Olive overshirt"
				/>
				{form.category === "scent" ? (
					<>
						<ChoiceChips
							label="Best for"
							options={SCENT_TIMES.map((value) => ({ value, label: capital(value) }))}
							value={form.scentTime}
							onChange={(value) => set("scentTime", value)}
						/>
						<ChoiceChips
							label="How full"
							options={[1, 0.8, 0.6, 0.4, 0.2].map((value) => ({
								value: String(value),
								label: `${value * 100}%`,
							}))}
							value={String(form.level)}
							onChange={(value) => set("level", Number(value))}
						/>
					</>
				) : (
					<>
						<TextField
							label="Size"
							value={form.size}
							onChangeText={(value) => set("size", value)}
							placeholder="M"
						/>
						<TextField
							label="Fit"
							value={form.fit}
							onChangeText={(value) => set("fit", value)}
							placeholder="relaxed"
						/>
						<TextField
							label="Fabric"
							value={form.fabric}
							onChangeText={(value) => set("fabric", value)}
							placeholder="cotton twill"
						/>
					</>
				)}
				<TextField
					label="Price"
					value={form.price}
					onChangeText={(value) => set("price", value)}
					keyboardType="numeric"
					suffix="Rs"
				/>
				<TextField
					label="Bought"
					value={form.boughtOn}
					onChangeText={(value) => set("boughtOn", value)}
					placeholder="YYYY-MM-DD"
				/>
				<TextField
					label="Care"
					value={form.care}
					onChangeText={(value) => set("care", value)}
					placeholder="Cold wash, hang dry"
				/>
				<TextField
					label="Note"
					value={form.note}
					onChangeText={(value) => set("note", value)}
					placeholder="Shoulders get snug as I bulk"
				/>
				{!priceOk || !dateOk ? (
					<PoText variant="meta13" tone="textDanger">
						{!priceOk ? "Check the price (like 6500)." : "Check the date (like 2026-03-20)."}
					</PoText>
				) : null}
			</View>

			<Footer>
				<PillButton
					label={editing ? "Remove" : "Cancel"}
					variant="secondary"
					onPress={editing ? remove : () => router.back()}
					style={styles.flex}
				/>
				<PillButton
					label={editing ? "Save" : "Save piece"}
					disabled={!canSave}
					onPress={() => void save()}
					style={styles.flex}
				/>
			</Footer>
		</FashionScreen>
	);
}

function SourceButton({
	icon,
	title,
	detail,
	onPress,
}: {
	icon: "Line/Plus" | "Filled/Camera";
	title: string;
	detail: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={[styles.source, { borderColor: colors.borderStrong }]}
		>
			<View style={styles.sourceHead}>
				<Icon name={icon} size={16} color={colors.textPrimary} />
				<PoText variant="row15">{title}</PoText>
			</View>
			<PoText variant="meta13" tone="textTertiary">
				{detail}
			</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pad: { paddingHorizontal: 6 },
	input: { gap: 10, padding: 16, borderRadius: 24, borderWidth: 1.5, minHeight: 92 },
	status: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	card: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
	imageRow: { flexDirection: "row", gap: 10 },
	current: { flex: 1, borderWidth: 1.5, borderRadius: 22, padding: 2 },
	sources: { flex: 1, gap: 10 },
	source: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 4,
		borderRadius: 20,
		borderWidth: 1,
		borderStyle: "dashed",
		padding: 10,
	},
	sourceHead: { flexDirection: "row", alignItems: "center", gap: 6 },
	alikes: { gap: 8 },
	alike: { borderWidth: 2, borderRadius: 16, padding: 1 },
	colours: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	colour: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 18,
		borderWidth: 1,
	},
});
