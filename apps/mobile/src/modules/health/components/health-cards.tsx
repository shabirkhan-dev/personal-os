import type { ColorTokens } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { clockOf } from "@/modules/home/lib/module-day";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import {
	type Band,
	CHECKUP_LABELS,
	type DueCheckup,
	type Readiness,
	type Reading,
	type ReadingKind,
	readingBand,
	type TodayDose,
} from "../lib/health-model";

type Tone = keyof ColorTokens;

export const BAND_TONES: Record<Band["tone"], Tone> = {
	good: "textSuccess",
	watch: "textWarning",
	high: "textDanger",
	urgent: "textDanger",
};

export function Card({ children, tint }: { children: React.ReactNode; tint?: Tone }) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.card, { backgroundColor: colors[tint ?? "bgSurface"] }]}>{children}</View>
	);
}

export function CardHead({
	title,
	right,
	onPress,
}: {
	title: string;
	right?: string;
	onPress?: () => void;
}) {
	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			disabled={!onPress}
			onPress={onPress}
			style={styles.head}
		>
			<PoText variant="title18" style={styles.flex}>
				{title}
			</PoText>
			{right ? (
				<PoText variant="meta13" tone={onPress ? "textLink" : "textTertiary"}>
					{right}
				</PoText>
			) : null}
		</Pressable>
	);
}

/** Today's readiness: the score, its word and the one line on why. */
export function ReadinessCard({ readiness }: { readiness: Readiness }) {
	const tone: Tone =
		readiness.score >= 75 ? "textSuccess" : readiness.score >= 50 ? "textWarning" : "textDanger";
	return (
		<Card>
			<View style={styles.readiness}>
				<View style={styles.score}>
					<PoText variant="display36" tone={tone}>
						{String(readiness.score)}
					</PoText>
				</View>
				<View style={styles.flex}>
					<PoText variant="row15">{readiness.label}</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{readiness.reason}
					</PoText>
				</View>
			</View>
		</Card>
	);
}

export type VitalTile = {
	kind: ReadingKind;
	label: string;
	icon: IconName;
	reading: Reading | null;
	value: string | null;
	unit: string;
};

/** Two columns of the latest vitals; an empty one offers to add it. */
export function VitalsGrid({
	tiles,
	onOpen,
	onAdd,
}: {
	tiles: readonly VitalTile[];
	onOpen: (kind: ReadingKind) => void;
	onAdd: (kind: ReadingKind) => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.grid}>
			{tiles.map((tile) => {
				const band = tile.reading ? readingBand(tile.reading) : null;
				return (
					<Pressable
						key={tile.kind}
						accessibilityRole="button"
						accessibilityLabel={
							tile.value ? `${tile.label}, ${tile.value} ${tile.unit}` : `Add ${tile.label}`
						}
						onPress={() => {
							haptics.tap();
							if (tile.value) onOpen(tile.kind);
							else onAdd(tile.kind);
						}}
						style={({ pressed }) => [
							styles.tile,
							{ backgroundColor: pressed ? colors.bgHover : colors.bgSurface },
						]}
					>
						<View style={styles.tileHead}>
							<Icon name={tile.icon} size={16} color={colors.textSecondary} />
							<PoText variant="meta13" tone="textSecondary" numberOfLines={1} style={styles.flex}>
								{tile.label}
							</PoText>
						</View>
						{tile.value ? (
							<PoText variant="title18" numberOfLines={1}>
								{tile.value}
								<PoText variant="meta13" tone="textTertiary">{` ${tile.unit}`}</PoText>
							</PoText>
						) : (
							<PoText variant="row15" tone="textLink">
								Add
							</PoText>
						)}
						<PoText
							variant="meta13"
							tone={band ? BAND_TONES[band.tone] : "textTertiary"}
							numberOfLines={1}
						>
							{band?.label ?? (tile.reading ? ago(tile.reading.at) : "Not logged")}
						</PoText>
					</Pressable>
				);
			})}
		</View>
	);
}

/** "Today", "Yesterday", "3 days ago". */
export function ago(at: string, now = new Date()): string {
	const days = Math.floor(
		(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
			new Date(
				new Date(at).getFullYear(),
				new Date(at).getMonth(),
				new Date(at).getDate(),
			).getTime()) /
			86_400_000,
	);
	if (days <= 0) return "Today";
	if (days === 1) return "Yesterday";
	return `${days} days ago`;
}

const DOSE_TEXT: Record<TodayDose["state"], { text: string; tone: Tone }> = {
	taken: { text: "Taken", tone: "textSuccess" },
	skipped: { text: "Skipped", tone: "textTertiary" },
	due: { text: "Take now", tone: "accentDefault" },
	missed: { text: "Missed", tone: "textDanger" },
	later: { text: "Later", tone: "textTertiary" },
};

/** Today's doses in time order, with Take and Skip on the ones due. */
export function DosesCard({
	doses,
	onTake,
	onSkip,
	onOpen,
}: {
	doses: readonly TodayDose[];
	onTake: (dose: TodayDose) => void;
	onSkip: (dose: TodayDose) => void;
	onOpen: () => void;
}) {
	const { colors } = usePoTheme();
	const taken = doses.filter((dose) => dose.state === "taken").length;
	return (
		<Card>
			<CardHead title="Medicines today" right={`${taken} of ${doses.length} ›`} onPress={onOpen} />
			{doses.map((dose) => {
				const state = DOSE_TEXT[dose.state];
				const open = dose.state === "due" || dose.state === "missed" || dose.state === "later";
				return (
					<View key={`${dose.medicine.id}-${dose.minutes}`} style={styles.dose}>
						<PoText variant="mono13" tone="textSecondary" style={styles.time}>
							{clockOf(dose.minutes)}
						</PoText>
						<View style={styles.flex}>
							<PoText variant="row15" numberOfLines={1}>
								{dose.medicine.name}
							</PoText>
							<PoText variant="meta13" tone={state.tone}>
								{[dose.medicine.dose, state.text].filter(Boolean).join(" · ")}
							</PoText>
						</View>
						{open ? (
							<>
								<SmallButton label="Skip" onPress={() => onSkip(dose)} />
								<SmallButton label="Take" primary onPress={() => onTake(dose)} />
							</>
						) : (
							<Icon
								name={dose.state === "taken" ? "Line/Check" : "Line/Close"}
								size={16}
								color={dose.state === "taken" ? colors.statusSuccess : colors.textTertiary}
							/>
						)}
					</View>
				);
			})}
		</Card>
	);
}

export function SmallButton({
	label,
	primary = false,
	onPress,
}: {
	label: string;
	primary?: boolean;
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
			style={({ pressed }) => [
				styles.small,
				{
					backgroundColor: primary ? colors.bgInverse : colors.bgSubtle,
					opacity: pressed ? 0.8 : 1,
				},
			]}
		>
			<PoText variant="text14Medium" tone={primary ? "textInverse" : "textPrimary"}>
				{label}
			</PoText>
		</Pressable>
	);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Nov 2026" from "2026-11-12". */
export function longDay(day: string): string {
	const [year, month, date] = day.split("-").map(Number) as [number, number, number];
	return `${date} ${MONTHS[month - 1] ?? ""} ${year}`;
}

/** The next checkup due, or one that's overdue. */
export function NextCheckupCard({ due, onOpen }: { due: DueCheckup; onOpen: () => void }) {
	return (
		<Card tint={due.overdue ? "statusDangerSubtle" : undefined}>
			<CardHead title="Next checkup" right="All ›" onPress={onOpen} />
			<View style={styles.dose}>
				<View style={styles.flex}>
					<PoText variant="row15">{due.checkup.title}</PoText>
					<PoText variant="meta13" tone={due.overdue ? "textDanger" : "textSecondary"}>
						{due.overdue
							? `Was due ${longDay(due.due)}`
							: `${due.booked ? "Booked for" : "Due around"} ${longDay(due.due)}`}
					</PoText>
				</View>
				<PoText variant="meta13" tone="textTertiary">
					{CHECKUP_LABELS[due.checkup.kind]}
				</PoText>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	readiness: { flexDirection: "row", alignItems: "center", gap: 16 },
	score: { width: 72, alignItems: "center" },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tile: { flexBasis: "48%", flexGrow: 1, gap: 4, padding: 12, borderRadius: 16 },
	tileHead: { flexDirection: "row", alignItems: "center", gap: 8 },
	dose: { flexDirection: "row", alignItems: "center", gap: 12 },
	time: { width: 48 },
	small: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center" },
});
