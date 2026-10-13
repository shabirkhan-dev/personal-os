import { textStyles } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AiInsight } from "@/modules/onboarding/components/ai-insight";
import { RulerSlider } from "@/modules/onboarding/components/ruler-slider";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { bmi, bmiBand, waterGoalLiters } from "@/modules/onboarding/lib/insights";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

const heightUnits = [
	{ value: "cm", label: "cm" },
	{ value: "ft", label: "ft" },
] as const;
const weightUnits = [
	{ value: "kg", label: "kg" },
	{ value: "lb", label: "lb" },
] as const;

function feetLabel(inches: number): string {
	return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

const bandLabel = {
	underweight: "below the healthy range",
	healthy: "a healthy range",
	overweight: "above the healthy range",
	obese: "well above the healthy range",
} as const;

/** 09 Setup 2 · Body */
export default function BodyScreen() {
	const { heightCm, weightKg, heightUnit, weightUnit, set } = useOnboardingStore();
	const bmiValue = bmi(heightCm, weightKg);
	const inches = Math.round(heightCm / CM_PER_INCH);
	const pounds = Math.round(weightKg / KG_PER_LB);

	return (
		<SetupFrame
			step={2}
			route={onboardingRoutes.body}
			title="Your body basics"
			body={["Used for calories, water and training goals."]}
		>
			<View style={styles.form}>
				<MeasureCard
					label="Height"
					unitPicker={
						<SegmentedControl
							size="sm"
							options={heightUnits}
							value={heightUnit}
							onChange={(value) => set("heightUnit", value)}
							accessibilityLabel="Height unit"
						/>
					}
					value={heightUnit === "cm" ? String(heightCm) : feetLabel(inches)}
					unit={heightUnit}
				>
					{heightUnit === "cm" ? (
						<RulerSlider
							key="cm"
							min={120}
							max={220}
							value={heightCm}
							onChange={(value) => set("heightCm", value)}
							accessibilityLabel="Height in centimetres"
						/>
					) : (
						<RulerSlider
							key="ft"
							min={48}
							max={86}
							value={inches}
							onChange={(value) => set("heightCm", Math.round(value * CM_PER_INCH))}
							accessibilityLabel="Height in feet and inches"
							formatLabel={feetLabel}
						/>
					)}
				</MeasureCard>
				<MeasureCard
					label="Weight"
					unitPicker={
						<SegmentedControl
							size="sm"
							options={weightUnits}
							value={weightUnit}
							onChange={(value) => set("weightUnit", value)}
							accessibilityLabel="Weight unit"
						/>
					}
					value={weightUnit === "kg" ? String(weightKg) : String(pounds)}
					unit={weightUnit}
				>
					{weightUnit === "kg" ? (
						<RulerSlider
							key="kg"
							min={30}
							max={200}
							value={weightKg}
							onChange={(value) => set("weightKg", value)}
							accessibilityLabel="Weight in kilograms"
						/>
					) : (
						<RulerSlider
							key="lb"
							min={70}
							max={440}
							value={pounds}
							onChange={(value) => set("weightKg", Math.round(value * KG_PER_LB))}
							accessibilityLabel="Weight in pounds"
						/>
					)}
				</MeasureCard>
			</View>
			<View style={styles.gap14} />
			<AiInsight
				parts={[
					[`BMI ${bmiValue.toFixed(1)}`],
					`, ${bandLabel[bmiBand(bmiValue)]}. Your water goal is `,
					[`${waterGoalLiters(weightKg).toFixed(1)} L a day`],
					".",
				]}
			/>
		</SetupFrame>
	);
}

type MeasureCardProps = {
	label: string;
	unitPicker: ReactNode;
	value: string;
	unit: string;
	children: ReactNode;
};

function MeasureCard({ label, unitPicker, value, unit, children }: MeasureCardProps) {
	const { colors } = usePoTheme();

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={styles.labelRow}>
				<PoText variant="eyebrow11" tone="textTertiary">
					{label}
				</PoText>
				{unitPicker}
			</View>
			<View style={styles.valueRow} accessibilityLiveRegion="polite">
				<PoText variant="hero40">{value}</PoText>
				<PoText variant="title18" tone="textTertiary" style={styles.unit}>
					{unit}
				</PoText>
			</View>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	form: { gap: 12 },
	card: {
		gap: 10,
		paddingTop: 16,
		paddingBottom: 14,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 6,
	},
	valueRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6 },
	unit: { lineHeight: textStyles.title18.lineHeight },
	gap14: { height: 14 },
});
