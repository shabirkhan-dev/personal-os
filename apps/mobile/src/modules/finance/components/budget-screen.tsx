import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ProgressBar, ScreenTitle } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useZakatLine } from "@/modules/faith";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { moveMoney, saveLimits } from "../data/finance-actions";
import { useFinanceToday } from "../hooks/use-finance";
import { MONTHS, rupees, spends } from "../lib/finance-math";
import {
	CATEGORIES,
	type Category,
	CATEGORY_HINTS,
	CATEGORY_LABELS,
	CATEGORY_TONES,
	type Entry,
} from "../lib/finance-model";
import { ButtonPair, Card, CardHead, Eyebrow } from "./finance-cards";
import { FinanceScreen } from "./finance-screen";
import { LimitsSheet, MoveSheet } from "./finance-sheets";

const amount = (value: number) => Math.round(value).toLocaleString("en-US");

function noteFor(
	category: Category,
	month: readonly Entry[],
	billNames: readonly string[],
): string {
	const titles = [
		...new Set(
			spends(month)
				.filter((entry) => entry.category === category)
				.map((entry) => entry.title.split(" · ")[0] ?? entry.title),
		),
	];
	if (category === "bills" && billNames.length > 0) return billNames.slice(0, 3).join(", ");
	if (titles.length > 0) return titles.slice(0, 2).join(", ");
	return CATEGORY_HINTS[category];
}

/** Finance · Budget: the month against its limits, line by line, and zakat from Faith. */
export function BudgetScreen() {
	const { colors } = usePoTheme();
	const { data, now, month, spent, budget, sums, pace } = useFinanceToday();
	const { settings, bills } = data;
	const faith = useOnboardingStore((state) => state.modules.includes("faith"));
	const zakat = useZakatLine();
	const [limits, setLimits] = useState(false);
	const [moving, setMoving] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const lines = CATEGORIES.filter(
		(category) => settings.limits[category] > 0 || sums[category] > 0,
	);
	const status =
		pace.state === "over"
			? { text: `${rupees(spent - budget)} over the month's budget`, tone: "textDanger" as const }
			: {
					text: `${Math.round(pace.spentShare * 100)}% spent, ${Math.round(pace.monthShare * 100)}% of the month gone · ${pace.state === "ahead" ? "ahead of pace" : "on track"}`,
					tone: pace.state === "ahead" ? ("textWarning" as const) : ("textSuccess" as const),
				};

	const failed = (error: unknown) => {
		console.error("[finance] could not save the budget", error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	return (
		<FinanceScreen>
			<ScreenTitle
				eyebrow={`${MONTHS[now.getMonth()]} · ${settings.protect ? "minimum only" : "runway mode"}`}
				title="Budget"
			/>
			<Card>
				<View style={styles.total}>
					<PoText variant="title30">{rupees(spent)}</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{`of ${rupees(budget)}`}
					</PoText>
				</View>
				<ProgressBar
					share={budget > 0 ? spent / budget : 0}
					tone={pace.state === "over" ? "statusDanger" : "accentDefault"}
				/>
				<PoText variant="meta13" tone={status.tone}>
					{status.text}
				</PoText>
			</Card>
			<Card>
				<CardHead title="Where it goes" />
				{lines.map((category) => {
					const limit = settings.limits[category];
					const full = limit > 0 ? sums[category] >= limit : sums[category] > 0;
					return (
						<View key={category} style={styles.line}>
							<View style={styles.lineHead}>
								<PoText variant="row15" style={styles.flex}>
									{CATEGORY_LABELS[category]}
								</PoText>
								<PoText variant="mono13" tone={full ? "textDanger" : "textSecondary"}>
									{`Rs ${amount(sums[category])} / ${amount(limit)}`}
								</PoText>
							</View>
							<ProgressBar
								share={limit > 0 ? sums[category] / limit : 1}
								tone={full ? "statusDanger" : CATEGORY_TONES[category]}
							/>
							<PoText variant="meta13" tone="textTertiary">
								{noteFor(
									category,
									month,
									bills.filter((bill) => bill.category === category).map((bill) => bill.name),
								)}
							</PoText>
						</View>
					);
				})}
			</Card>
			{faith && zakat ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Zakat: ${zakat.text}`}
					onPress={() => router.push("/faith/zakat")}
				>
					<Card tone={{ bg: "statusSuccessSubtle", border: "statusSuccessSubtle" }}>
						<View style={styles.lineHead}>
							<View style={styles.flex}>
								<Eyebrow tone="textSuccess">Zakat · from Faith</Eyebrow>
								<PoText variant="row15" tone={zakat.due ? "textWarning" : "textPrimary"}>
									{zakat.text}
								</PoText>
							</View>
							<Icon name="Line/Chevron right" size={16} color={colors.textSuccess} />
						</View>
					</Card>
				</Pressable>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textWarning">
					{notice}
				</PoText>
			) : null}
			<ButtonPair
				secondary={{ label: "Change limits", onPress: () => setLimits(true) }}
				primary={{ label: "Move money", onPress: () => setMoving(true) }}
			/>
			<LimitsSheet
				visible={limits}
				limits={settings.limits}
				onClose={() => setLimits(false)}
				onSave={(next) => {
					void saveLimits(settings, next)
						.then(() => haptics.success())
						.catch(failed);
					setLimits(false);
				}}
			/>
			<MoveSheet
				visible={moving}
				limits={settings.limits}
				onClose={() => setMoving(false)}
				onMove={(from, to, value) => {
					void moveMoney(settings, from, to, value)
						.then(() => haptics.success())
						.catch(failed);
					setMoving(false);
				}}
			/>
		</FinanceScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	total: { flexDirection: "row", alignItems: "baseline", gap: 8 },
	line: { gap: 8, paddingVertical: 4 },
	lineHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
