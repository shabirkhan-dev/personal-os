import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import {
	ageLabel,
	compactMoney,
	fullMoney,
	nextService,
	progress,
	type RoadmapStop,
	whenLabel,
} from "../lib/wishlist-math";
import {
	CATEGORY_LABELS,
	DREAM_CATEGORIES,
	type Dream,
	type DreamCategory,
	type Owned,
	type PhotoKey,
} from "../lib/wishlist-model";
import { DreamImage } from "./dream-image";

/** Within this many days a date reads as "soon" (accent) on the list. */
const SOON_DAYS = 548;

/** The card surface the Wishlist frames use: bg/surface, radius 28, no border. */
function Surface({ children, padding = 14 }: { children: ReactNode; padding?: number }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.surface, { padding, backgroundColor: colors.bgSurface }]}>{children}</View>
	);
}

/** A thin saved-so-far bar: 8px track on bg/hover, success fill. */
export function SavedBar({ share }: { share: number }) {
	const { colors } = usePoTheme();
	const width = `${Math.round(Math.min(1, Math.max(0, share)) * 100)}%` as const;
	return (
		<View style={[styles.track, { backgroundColor: colors.bgHover }]}>
			<View style={[styles.fill, { width, backgroundColor: colors.statusSuccess }]} />
		</View>
	);
}

/** Up next: the dream that gets the next rupee, big photo, price and how saving is going. */
export function UpNextCard({
	stop,
	now,
	note,
	onPress,
}: {
	stop: RoadmapStop;
	now: Date;
	/** "Saving starts with the first salary", "Rs 120k saved · ready 2027 · Q2". */
	note: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const { dream } = stop;
	const eyebrow = `Up next · ${dream.paysForItself ? "work tool" : CATEGORY_LABELS[dream.category]}`;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Up next, ${dream.name}, ${fullMoney(dream.price)}`}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
		>
			<Surface>
				<DreamImage photo={dream.photo} category={dream.category} height={190} radius={18} />
				<View style={styles.upNextText}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{eyebrow}
					</PoText>
					<View style={styles.baseline}>
						<PoText variant="title30" style={styles.flex} numberOfLines={2}>
							{dream.name}
						</PoText>
						<PoText variant="mono13" tone="textSecondary">
							{fullMoney(dream.price)}
						</PoText>
					</View>
				</View>
				<SavedBar share={progress(dream)} />
				<View style={styles.noteRow}>
					{dream.paysForItself ? (
						<View style={[styles.tag, { backgroundColor: colors.statusSuccessSubtle }]}>
							<PoText variant="meta13" tone="textSuccess">
								Pays for itself
							</PoText>
						</View>
					) : null}
					<PoText variant="meta13" tone="textTertiary" style={styles.flex} numberOfLines={1}>
						{note || (stop.ready ? `Ready around ${whenLabel(stop.ready, now)}` : "")}
					</PoText>
				</View>
			</Surface>
		</Pressable>
	);
}

/** "All 8 · Tech 3 · Bikes 1 …": only categories that have dreams, plus All. */
export function CategoryChips({
	counts,
	total,
	value,
	onChange,
}: {
	counts: Record<DreamCategory, number>;
	total: number;
	value: DreamCategory | "all";
	onChange: (value: DreamCategory | "all") => void;
}) {
	return (
		<View style={styles.chips}>
			<FilterChip
				label={`All ${total}`}
				selected={value === "all"}
				onPress={() => onChange("all")}
			/>
			{DREAM_CATEGORIES.filter((category) => counts[category] > 0).map((category) => (
				<FilterChip
					key={category}
					label={`${CATEGORY_LABELS[category]} ${counts[category]}`}
					selected={value === category}
					onPress={() => onChange(category)}
				/>
			))}
		</View>
	);
}

/** One dream on the list: photo, name, short price and when it's ready. */
export function DreamRow({
	stop,
	now,
	onPress,
}: {
	stop: RoadmapStop;
	now: Date;
	onPress: () => void;
}) {
	const { dream } = stop;
	const target = dream.targetDate ? new Date(dream.targetDate) : null;
	const when = target ?? stop.ready;
	const soon = stop.days !== null && stop.days <= SOON_DAYS;
	const label = when ? whenLabel(when, now) : dream.status === "saving" ? "Saving" : "Someday";
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${dream.name}, ${compactMoney(dream.price)}, ${label}`}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
		>
			<DreamImage photo={dream.photo} category={dream.category} width={56} height={56} />
			<View style={styles.rowText}>
				<PoText variant="row15" numberOfLines={1}>
					{dream.name}
				</PoText>
				<PoText variant="mono13" tone="textTertiary">
					{compactMoney(dream.price)}
				</PoText>
			</View>
			<PoText variant="meta13" tone={soon ? "accentDefault" : "textSecondary"}>
				{label}
			</PoText>
		</Pressable>
	);
}

/** "The list · by when". */
export function DreamListCard({
	stops,
	now,
	onOpen,
}: {
	stops: readonly RoadmapStop[];
	now: Date;
	onOpen: (dream: Dream) => void;
}) {
	return (
		<Surface>
			<View style={styles.listHead}>
				<PoText variant="title18" style={styles.flex}>
					The list
				</PoText>
				<PoText variant="mono13" tone="textTertiary">
					by when
				</PoText>
			</View>
			{stops.map((stop) => (
				<DreamRow key={stop.dream.id} stop={stop} now={now} onPress={() => onOpen(stop.dream)} />
			))}
		</Surface>
	);
}

/** The green rule card: cash only, no interest, the cool-off. */
export function RulesCard({ coolOffDays }: { coolOffDays: number }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.rules, { backgroundColor: colors.statusSuccessSubtle }]}>
			<PoText variant="eyebrow11" tone="textSuccess">
				{`Cash only · no interest · ${coolOffDays}-day cool-off`}
			</PoText>
			<PoText variant="meta13" tone="textSecondary">
				{`Nothing gets bought on instalments with interest, and every dream waits ${coolOffDays} days on the list first.`}
			</PoText>
		</View>
	);
}

/** "Your garage · 450 street bike / Service due in 600 km". */
export function GarageRow({
	owned,
	count,
	now,
	onPress,
}: {
	owned: Owned | null;
	count: number;
	now: Date;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	const service = owned ? nextService(owned, now) : null;
	const age = owned ? ageLabel(owned.boughtAt, now) : null;
	const title = owned ? `Your garage · ${owned.name}` : "Your garage";
	const subtitle = service
		? service.state.due
			? `${service.item.label} is due`
			: `${service.item.label} · ${service.state.label}`
		: owned
			? `${count} ${count === 1 ? "thing" : "things"}${age ? ` · ${age}` : ""}`
			: "Add what you own to look after it";
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${title}, ${subtitle}`}
			onPress={() => {
				haptics.tap();
				onPress();
			}}
		>
			<Surface padding={12}>
				<View style={styles.garage}>
					<DreamImage
						photo={owned?.photo ?? null}
						category={owned?.kind === "tech" ? "tech" : "bikes"}
						width={52}
						height={52}
					/>
					<View style={styles.rowText}>
						<PoText variant="row15" numberOfLines={1}>
							{title}
						</PoText>
						<PoText
							variant="meta13"
							tone={
								service && service.state.tone !== "statusSuccess" ? "textWarning" : "textSecondary"
							}
							numberOfLines={1}
						>
							{subtitle}
						</PoText>
					</View>
					<Icon name="Line/Chevron right" size={18} color={colors.textTertiary} />
				</View>
			</Surface>
		</Pressable>
	);
}

export const STARTERS: ReadonlyArray<{
	label: string;
	text: string;
	category: DreamCategory;
	photo: PhotoKey;
}> = [
	{ label: "A bike", text: "a bike", category: "bikes", photo: "adventure-bike" },
	{ label: "A car", text: "a car", category: "cars", photo: "compact-suv" },
	{ label: "A laptop", text: "a laptop", category: "tech", photo: "pro-laptop" },
	{ label: "A phone", text: "a phone", category: "tech", photo: "flagship-phone" },
	{ label: "A trip", text: "a trip", category: "trips", photo: "ski-trip" },
	{ label: "Gear", text: "gear", category: "gear", photo: "boxing-kit" },
];

/** Empty Home: "What would you love to own one day?" with six starters. */
export function StartCard({ onPick }: { onPick: (starter: (typeof STARTERS)[number]) => void }) {
	return (
		<Surface padding={18}>
			<View style={styles.startHead}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Start your list
				</PoText>
				<PoText variant="title18">What would you love to own one day?</PoText>
			</View>
			<View style={styles.grid}>
				{STARTERS.map((starter) => (
					<Pressable
						key={starter.label}
						accessibilityRole="button"
						accessibilityLabel={`Add ${starter.label.toLowerCase()}`}
						onPress={() => {
							haptics.tap();
							onPick(starter);
						}}
						style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
					>
						<DreamImage
							photo={{ kind: "bundled", key: starter.photo }}
							category={starter.category}
							height={80}
						/>
						<PoText variant="meta13" tone="textSecondary">
							{starter.label}
						</PoText>
					</Pressable>
				))}
			</View>
			<PoText variant="meta13" tone="textSecondary">
				Tap one or just type it. I'll find the price in Pakistan when you're signed in.
			</PoText>
		</Surface>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pressed: { opacity: 0.7 },
	surface: { gap: 12, borderRadius: 28, overflow: "hidden" },
	track: { height: 8, borderRadius: 4, overflow: "hidden" },
	fill: { height: 8, borderRadius: 4, minWidth: 4 },
	upNextText: { gap: 4, paddingHorizontal: 4 },
	baseline: { flexDirection: "row", alignItems: "baseline", gap: 8 },
	noteRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 },
	tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	listHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingBottom: 2 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	rowText: { flex: 1, gap: 2 },
	rules: { gap: 6, padding: 16, borderRadius: 28 },
	garage: { flexDirection: "row", alignItems: "center", gap: 12 },
	startHead: { gap: 14 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tile: { width: "31%", flexGrow: 1, gap: 6 },
});
