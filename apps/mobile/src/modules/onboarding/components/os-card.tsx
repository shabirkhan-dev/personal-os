import { elevation } from "@personal-os/tokens";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { Glow } from "@/components/ui/glow";
import { PoText } from "@/components/ui/po-text";
import { toShadowStyle, usePoTheme } from "@/theme";
import { type CardStat, cardStats, type Member, memberLabel, sinceLabel } from "../lib/member-card";
import { type ModuleOption, moduleOptions } from "../lib/options";
import { useOnboardingStore } from "../store/onboarding-store";
import { Avatar } from "./avatar";

const BAND_LABEL = {
	underweight: "low",
	healthy: "healthy",
	overweight: "high",
	obese: "high",
} as const;

type OsCardProps = {
	member: Member | null;
	/** Modules finished so far; their dots fill in. Defaults to all of them. */
	ready?: number;
};

/** Kit v2 "OS Card" (Figma 176:1070): the member card on Building and All set. */
export function OsCard({ member, ready }: OsCardProps) {
	const { colors } = usePoTheme();
	const answers = useOnboardingStore();
	const stats = cardStats(answers);
	const modules = answers.modules
		.map((id) => moduleOptions.find((option) => option.id === id))
		.filter((option): option is ModuleOption => option !== undefined);
	const filled = ready ?? modules.length;
	const cells: {
		id: string;
		stat: CardStat;
		label: string;
		tone?: "textSuccess" | "textWarning";
	}[] = [
		{ id: "height", stat: stats.height, label: "Height" },
		{ id: "weight", stat: stats.weight, label: "Weight" },
		{
			id: "bmi",
			stat: { value: stats.bmi },
			label: `BMI · ${BAND_LABEL[stats.band]}`,
			tone: stats.band === "healthy" ? "textSuccess" : "textWarning",
		},
	];

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				toShadowStyle(elevation.floating),
			]}
		>
			<View style={styles.clip}>
				<Glow
					tone="statusViolet"
					width={300}
					height={180}
					left={60}
					top={-110}
					blur={70}
					strength="member"
				/>
				<View style={[styles.tab, { backgroundColor: colors.bgSubtle }]}>
					<View style={styles.inline8}>
						<View style={[styles.dot8, { backgroundColor: colors.accentDefault }]} />
						<PoText variant="row15">Personal OS</PoText>
					</View>
					<PoText variant="eyebrow11" tone="textTertiary">
						Member
					</PoText>
				</View>
				<View
					style={[
						styles.pocket,
						{ backgroundColor: colors.bgSurface },
						toShadowStyle(elevation.pocket),
					]}
				>
					<View style={[styles.stitch, { borderColor: colors.borderDefault }]}>
						<View style={styles.who}>
							<Avatar name={answers.name} size={52} />
							<View style={styles.whoText}>
								<PoText variant="title18" numberOfLines={1}>
									{answers.name.trim() || "You"}
								</PoText>
								<PoText variant="meta13" tone="textSecondary">
									{sinceLabel(member)}
								</PoText>
							</View>
						</View>
						<View style={styles.stats}>
							{cells.map((cell, index) => (
								<Fragment key={cell.id}>
									{index > 0 ? (
										<View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
									) : null}
									<View style={styles.stat}>
										<View style={styles.number}>
											<PoText variant="title18">{cell.stat.value}</PoText>
											{cell.stat.unit ? (
												<PoText variant="meta13" tone="textTertiary">
													{cell.stat.unit}
												</PoText>
											) : null}
										</View>
										<PoText variant="meta13" tone={cell.tone ?? "textSecondary"} numberOfLines={1}>
											{cell.label}
										</PoText>
									</View>
								</Fragment>
							))}
						</View>
						<View style={styles.bottom}>
							<View style={styles.inline6}>
								{modules.map((option, index) => (
									<View
										key={option.id}
										style={[
											styles.dot10,
											{
												backgroundColor:
													index < filled ? colors[option.iconTone] : colors.borderDefault,
											},
										]}
									/>
								))}
								<PoText variant="meta13" tone="textSecondary">
									{`${modules.length} ${modules.length === 1 ? "module" : "modules"}`}
								</PoText>
							</View>
							<PoText variant="mono13" tone="textTertiary">
								{memberLabel(member)}
							</PoText>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { alignSelf: "stretch", height: 308, borderRadius: 32, borderWidth: 1 },
	clip: { flex: 1, borderRadius: 31, overflow: "hidden" },
	tab: {
		position: "absolute",
		left: 14,
		right: 14,
		top: 14,
		height: 70,
		paddingTop: 16,
		paddingHorizontal: 18,
		borderRadius: 22,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	inline8: { flexDirection: "row", alignItems: "center", gap: 8 },
	inline6: { flexDirection: "row", alignItems: "center", gap: 6 },
	dot8: { width: 8, height: 8, borderRadius: 4 },
	dot10: { width: 10, height: 10, borderRadius: 5 },
	pocket: { position: "absolute", left: -1, right: -1, top: 63, bottom: -1, borderRadius: 30 },
	stitch: {
		position: "absolute",
		left: 12,
		right: 12,
		top: 12,
		bottom: 12,
		padding: 16,
		borderRadius: 22,
		borderWidth: 1.5,
		borderStyle: "dashed",
		justifyContent: "space-between",
	},
	who: { flexDirection: "row", alignItems: "center", gap: 12 },
	whoText: { flex: 1, gap: 2 },
	stats: { flexDirection: "row", alignItems: "center" },
	stat: { flex: 1, alignItems: "center", gap: 2 },
	number: { flexDirection: "row", alignItems: "baseline", gap: 3 },
	divider: { width: 1, height: 32 },
	bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
