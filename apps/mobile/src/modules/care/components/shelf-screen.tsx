import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip, ProgressBar, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { dayKey } from "@/lib/day";
import { formatMoney } from "@/lib/money";
import { haptics } from "@/lib/haptics";
import { deleteProduct, restock, saveProduct } from "../data/care-actions";
import { useCare } from "../hooks/use-care";
import { useNow } from "@/lib/use-now";
import { monthlyCost, reorderSoon, supply } from "../lib/care-math";
import { type Area, AREAS, AREA_LABELS, type Product } from "../lib/care-model";
import { Banner, Card, CardHead } from "./home-cards";
import { CareScreen } from "./care-screen";
import { ProductImage } from "./product-image";

const money = (amount: number) => formatMoney(Math.round(amount)).replace(/\.00$/, "");

type Draft = {
	id?: string;
	name: string;
	area: Area;
	weeks: string;
	price: string;
	tool: boolean;
	openedOn?: string;
	photo?: string | null;
};

/** Shelf: every product by area with how long it lasts, and what to reorder this week. */
export function ShelfScreen() {
	const data = useCare();
	const now = useNow();
	const [open, setOpen] = useState<Product | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const { products } = data;
	const soon = reorderSoon(products, now);

	const failed = (what: string) => (error: unknown) => {
		console.error(`[care] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const save = () => {
		if (!draft) return;
		const name = draft.name.trim();
		if (!name) {
			setNotice("Give the product a name.");
			return;
		}
		const weeks = Number(draft.weeks.replace(",", "."));
		saveProduct({
			...(draft.id ? { id: draft.id } : {}),
			...(draft.photo !== undefined ? { photo: draft.photo } : {}),
			name,
			area: draft.area,
			openedOn: draft.openedOn ?? dayKey(now),
			lastsDays: draft.tool
				? 0
				: Math.max(1, Math.round((Number.isFinite(weeks) && weeks > 0 ? weeks : 6) * 7)),
			price: Math.max(0, Math.round(Number(draft.price) || 0)),
		})
			.then(() => {
				haptics.success();
				setDraft(null);
			})
			.catch(failed("save the product"));
	};

	return (
		<CareScreen
			action={{
				icon: "Filled/Edit",
				label: "Add a product",
				onPress: () => setDraft({ name: "", area: "face", weeks: "6", price: "", tool: false }),
			}}
		>
			<ScreenTitle
				eyebrow={`${products.length} products · ${money(monthlyCost(products))} a month`}
				title="Shelf"
			/>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			{products.length === 0 ? (
				<Card>
					<PoText variant="body15" tone="textSecondary">
						Nothing on the shelf yet. Add what you use with the pencil, or build a routine on Care's
						Home.
					</PoText>
				</Card>
			) : null}
			{AREAS.map((area) => {
				const items = products.filter((product) => product.area === area);
				if (items.length === 0) return null;
				return (
					<Card key={area}>
						<CardHead
							title={AREA_LABELS[area]}
							right={`${items.length} item${items.length === 1 ? "" : "s"}`}
						/>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.row}
						>
							{items.map((product) => {
								const left = supply(product, now);
								return (
									<Pressable
										key={product.id}
										accessibilityRole="button"
										accessibilityLabel={`${product.name}, ${left ? `${left.label} left` : "keep"}`}
										onPress={() => setOpen(product)}
										style={styles.item}
									>
										<ProductImage photo={product.photo} size={96} radius={18} />
										<PoText variant="text14" numberOfLines={1}>
											{product.name}
										</PoText>
										{left ? <ProgressBar share={left.share} tone={left.tone} /> : null}
										<PoText
											variant="mono13"
											tone={left && left.daysLeft <= 14 ? "textWarning" : "textTertiary"}
										>
											{left ? left.label : "Keep"}
										</PoText>
									</Pressable>
								);
							})}
						</ScrollView>
					</Card>
				);
			})}
			{soon.products.length > 0 ? (
				<Banner tone="caution" eyebrow="Reorder this week">
					{`${soon.products.map((product) => product.name).join(" and ")}${soon.total > 0 ? ` · about ${money(soon.total)}` : ""}`}
				</Banner>
			) : null}

			<Sheet visible={open !== null} title={open?.name ?? ""} onClose={() => setOpen(null)}>
				{open ? (
					<View style={styles.sheet}>
						<ProductImage photo={open.photo} size={120} radius={20} />
						<PoText variant="meta13" tone="textSecondary">
							{open.lastsDays > 0
								? `Opened ${open.openedOn} · lasts about ${Math.round(open.lastsDays / 7)} weeks${open.price ? ` · ${money(open.price)}` : ""}`
								: `A tool you keep${open.price ? ` · ${money(open.price)}` : ""}`}
						</PoText>
						{open.lastsDays > 0 ? (
							<PillButton
								label="Opened a new one today"
								onPress={() => {
									void restock(open)
										.then(() => haptics.success())
										.catch(failed("restock"));
									setOpen(null);
								}}
							/>
						) : null}
						<PillButton
							label="Edit"
							variant="secondary"
							onPress={() => {
								setDraft({
									id: open.id,
									name: open.name,
									area: open.area,
									weeks: String(Math.max(1, Math.round(open.lastsDays / 7))),
									price: open.price ? String(open.price) : "",
									tool: open.lastsDays === 0,
									openedOn: open.openedOn,
									photo: open.photo,
								});
								setOpen(null);
							}}
						/>
						<PillButton
							label="Remove from shelf"
							variant="ghost"
							onPress={() => {
								void deleteProduct(open).catch(failed("remove the product"));
								setOpen(null);
							}}
						/>
					</View>
				) : null}
			</Sheet>

			<Sheet
				visible={draft !== null}
				title={draft?.id ? "Edit product" : "Add a product"}
				onClose={() => setDraft(null)}
				action={{ label: "Save", onPress: save }}
			>
				{draft ? (
					<View style={styles.sheet}>
						<TextField
							label="Name"
							value={draft.name}
							onChangeText={(name) => setDraft({ ...draft, name })}
							placeholder="Gentle foaming cleanser"
						/>
						<View style={styles.chips}>
							{AREAS.map((area) => (
								<FilterChip
									key={area}
									label={AREA_LABELS[area]}
									selected={draft.area === area}
									onPress={() => setDraft({ ...draft, area })}
								/>
							))}
							<FilterChip
								label="A tool I keep"
								selected={draft.tool}
								onPress={() => setDraft({ ...draft, tool: !draft.tool })}
							/>
						</View>
						{draft.tool ? null : (
							<TextField
								label="Lasts about"
								value={draft.weeks}
								onChangeText={(weeks) => setDraft({ ...draft, weeks })}
								keyboardType="decimal-pad"
								suffix="weeks"
							/>
						)}
						<TextField
							label="Price"
							value={draft.price}
							onChangeText={(price) => setDraft({ ...draft, price })}
							keyboardType="number-pad"
							suffix="Rs"
							onSubmitEditing={save}
						/>
					</View>
				) : null}
			</Sheet>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	row: { gap: 10 },
	item: { width: 96, gap: 6 },
	sheet: { gap: 12 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
