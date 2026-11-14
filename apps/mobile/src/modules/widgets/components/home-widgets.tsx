import { type ColorMode, colors as palette } from "@personal-os/tokens";
import { type ColorProp, FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetSnapshot } from "../lib/widget-data";
import { clockText, shortMoney, untilText } from "../lib/widget-text";

/**
 * The home-screen widgets, drawn with the widget library's primitives (Android RemoteViews, not
 * React Native views). Colours come from the Kit v2 tokens, one set per light and dark mode.
 */

export const WIDGET_NAMES = ["Water", "Tasbih", "Today", "Money"] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

/** Click actions the widget task handles itself; anything else opens the app. */
export const ADD_WATER = "ADD_WATER";
export const TASBIH_TAP = "TASBIH_TAP";
export const GLASS_ML = 250;

type Props = { data: WidgetSnapshot; mode: ColorMode; now: Date };

const hex = (value: string) => value as ColorProp;

const tone = (mode: ColorMode) => {
	const c = palette[mode];
	return {
		bg: hex(c.bgSurface),
		subtle: hex(c.bgSubtle),
		track: hex(c.bgSelected),
		text: hex(c.textPrimary),
		muted: hex(c.textSecondary),
		faint: hex(c.textTertiary),
		accent: hex(c.accentDefault),
		onAccent: hex(c.textOnAccent),
		success: hex(c.statusSuccess),
		danger: hex(c.statusDanger),
		violet: hex(c.statusViolet),
	};
};

function Bar({ share, fill, track }: { share: number; fill: ColorProp; track: ColorProp }) {
	const filled = Math.round(Math.min(1, Math.max(0, share)) * 100);
	return (
		<FlexWidget
			style={{
				width: "match_parent",
				height: 8,
				borderRadius: 4,
				backgroundColor: track,
				flexDirection: "row",
			}}
		>
			{filled > 0 ? (
				<FlexWidget style={{ flex: filled, height: 8, borderRadius: 4, backgroundColor: fill }} />
			) : null}
			{filled < 100 ? <FlexWidget style={{ flex: 100 - filled, height: 8 }} /> : null}
		</FlexWidget>
	);
}

function Eyebrow({ text, color }: { text: string; color: ColorProp }) {
	return (
		<TextWidget
			text={text.toUpperCase()}
			style={{ fontSize: 11, color, letterSpacing: 0.08, fontWeight: "600" }}
		/>
	);
}

export function WaterWidget({ data, mode }: Props) {
	const t = tone(mode);
	const { ml, targetMl } = data.water;
	const share = targetMl > 0 ? ml / targetMl : 0;
	return (
		<FlexWidget
			clickAction="OPEN_URI"
			clickActionData={{ uri: "personalos://" }}
			style={{
				height: "match_parent",
				width: "match_parent",
				backgroundColor: t.bg,
				borderRadius: 24,
				padding: 14,
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<Eyebrow text="Water" color={t.faint} />
			<FlexWidget style={{ flexDirection: "column" }}>
				<TextWidget
					text={`${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L`}
					style={{ fontSize: 28, color: t.text, fontWeight: "600" }}
				/>
				<TextWidget
					text={share >= 1 ? "Goal reached" : `of ${(targetMl / 1000).toFixed(1)} L`}
					style={{ fontSize: 12, color: share >= 1 ? t.success : t.muted }}
				/>
			</FlexWidget>
			<Bar share={share} fill={t.accent} track={t.track} />
			<FlexWidget
				clickAction={ADD_WATER}
				style={{
					width: "match_parent",
					height: 36,
					borderRadius: 18,
					backgroundColor: t.accent,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<TextWidget
					text={`+ ${GLASS_ML} ml`}
					clickAction={ADD_WATER}
					style={{ fontSize: 14, color: t.onAccent, fontWeight: "600" }}
				/>
			</FlexWidget>
		</FlexWidget>
	);
}

export function TasbihWidget({ data, mode }: Props) {
	const t = tone(mode);
	const { label, arabic, count, target, setsDone, sets } = data.tasbih;
	const done = count >= target;
	return (
		<FlexWidget
			clickAction={TASBIH_TAP}
			style={{
				height: "match_parent",
				width: "match_parent",
				backgroundColor: t.bg,
				borderRadius: 24,
				padding: 14,
				flexDirection: "column",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<Eyebrow
				text={sets > 0 ? `Tasbih · set ${Math.min(sets, setsDone + 1)} of ${sets}` : "Tasbih"}
				color={t.faint}
			/>
			{arabic ? (
				<TextWidget
					text={arabic}
					clickAction={TASBIH_TAP}
					style={{ fontSize: 18, color: t.text }}
				/>
			) : null}
			<TextWidget
				text={String(count)}
				clickAction={TASBIH_TAP}
				style={{ fontSize: 40, color: done ? t.success : t.text, fontWeight: "600" }}
			/>
			<TextWidget
				text={done ? `${label} · done` : `${label} · of ${target}`}
				clickAction={TASBIH_TAP}
				style={{ fontSize: 12, color: t.muted }}
			/>
			<TextWidget text="Tap anywhere to count" style={{ fontSize: 11, color: t.faint }} />
		</FlexWidget>
	);
}

export function MoneyWidget({ data, mode }: Props) {
	const t = tone(mode);
	const money = data.money;
	return (
		<FlexWidget
			clickAction="OPEN_URI"
			clickActionData={{ uri: "personalos://finance/budget" }}
			style={{
				height: "match_parent",
				width: "match_parent",
				backgroundColor: t.bg,
				borderRadius: 24,
				padding: 14,
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<Eyebrow text="Left this month" color={t.faint} />
			{money ? (
				<>
					<TextWidget
						text={shortMoney(money.left)}
						style={{ fontSize: 26, color: money.left < 0 ? t.danger : t.text, fontWeight: "600" }}
					/>
					<Bar
						share={money.budget > 0 ? money.spent / money.budget : 0}
						fill={money.left < 0 ? t.danger : t.success}
						track={t.track}
					/>
					<TextWidget
						text={`${shortMoney(money.spent)} of ${shortMoney(money.budget)} spent`}
						style={{ fontSize: 12, color: t.muted }}
					/>
				</>
			) : (
				<TextWidget
					text="Set a budget in Finance to see what's left."
					maxLines={3}
					style={{ fontSize: 13, color: t.muted }}
				/>
			)}
		</FlexWidget>
	);
}

export function TodayWidget({ data, mode, now }: Props) {
	const t = tone(mode);
	const { water, money, prayer } = data;
	const cell = {
		flex: 1,
		height: "match_parent" as const,
		backgroundColor: t.subtle,
		borderRadius: 16,
		padding: 10,
		flexDirection: "column" as const,
		justifyContent: "space-between" as const,
	};
	return (
		<FlexWidget
			clickAction="OPEN_URI"
			clickActionData={{ uri: "personalos://" }}
			style={{
				height: "match_parent",
				width: "match_parent",
				backgroundColor: t.bg,
				borderRadius: 24,
				padding: 12,
				flexDirection: "column",
			}}
		>
			<FlexWidget style={{ flexDirection: "row", width: "match_parent", marginBottom: 8 }}>
				<Eyebrow text="Today" color={t.faint} />
			</FlexWidget>
			<FlexWidget style={{ flex: 1, flexDirection: "row", width: "match_parent" }}>
				<FlexWidget style={{ ...cell, marginRight: 8 }}>
					<TextWidget text="Next prayer" style={{ fontSize: 11, color: t.faint }} />
					<TextWidget
						text={prayer ? prayer.label : "Set up"}
						style={{ fontSize: 16, color: t.text, fontWeight: "600" }}
					/>
					<TextWidget
						text={prayer ? `${clockText(prayer.at)} · ${untilText(prayer.at, now)}` : "in Faith"}
						style={{ fontSize: 11, color: t.muted }}
					/>
				</FlexWidget>
				<FlexWidget clickAction={ADD_WATER} style={{ ...cell, marginRight: 8 }}>
					<TextWidget text="Water" style={{ fontSize: 11, color: t.faint }} />
					<TextWidget
						text={`${(water.ml / 1000).toFixed(1)} L`}
						clickAction={ADD_WATER}
						style={{ fontSize: 16, color: t.text, fontWeight: "600" }}
					/>
					<TextWidget
						text={`Tap + ${GLASS_ML} ml`}
						clickAction={ADD_WATER}
						style={{ fontSize: 11, color: t.accent }}
					/>
				</FlexWidget>
				<FlexWidget
					clickAction="OPEN_URI"
					clickActionData={{ uri: "personalos://finance/budget" }}
					style={cell}
				>
					<TextWidget text="Money left" style={{ fontSize: 11, color: t.faint }} />
					<TextWidget
						text={money ? shortMoney(money.left) : "No budget"}
						style={{
							fontSize: 16,
							color: money && money.left < 0 ? t.danger : t.text,
							fontWeight: "600",
						}}
					/>
					<TextWidget text="this month" style={{ fontSize: 11, color: t.muted }} />
				</FlexWidget>
			</FlexWidget>
		</FlexWidget>
	);
}

const both = (draw: (mode: ColorMode) => React.JSX.Element) => ({
	light: draw("light"),
	dark: draw("dark"),
});

export function renderWidget(name: string, data: WidgetSnapshot, now: Date) {
	switch (name) {
		case "Water":
			return both((mode) => <WaterWidget data={data} mode={mode} now={now} />);
		case "Tasbih":
			return both((mode) => <TasbihWidget data={data} mode={mode} now={now} />);
		case "Money":
			return both((mode) => <MoneyWidget data={data} mode={mode} now={now} />);
		default:
			return both((mode) => <TodayWidget data={data} mode={mode} now={now} />);
	}
}
