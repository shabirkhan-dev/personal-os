import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ScreenTitle } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { CURRENCY } from "@/lib/money";
import { useNow } from "@/lib/use-now";
import { DateWheel } from "@/modules/onboarding/components/date-wheel";
import { RulerSlider } from "@/modules/onboarding/components/ruler-slider";
import { ageFromBirthday } from "@/modules/onboarding/lib/insights";
import type { Gender } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import {
	type OnboardingAnswers,
	useOnboardingStore,
} from "@/modules/onboarding/store/onboarding-store";
import { type ThemePreference, usePoTheme } from "@/theme";
import {
	themeLabel,
	type UnitSystem,
	unitsFor,
	unitsLabel,
	unitSystem,
	weekStartLabel,
} from "../lib/labels";
import type { WeekStart } from "../lib/profile-document";
import { useProfileStore } from "../store/profile-store";
import { OptionSheet } from "./option-sheet";
import { SectionLabel, SettingsCard, SettingsRow } from "./settings-list";

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type OpenSheet =
	| "height"
	| "weight"
	| "birthday"
	| "gender"
	| "units"
	| "theme"
	| "currency"
	| "week"
	| null;

const themeOptions = [
	{ value: "system", label: "Same as the phone" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;
const unitOptions = [
	{ value: "metric", label: "Centimetres and kilograms" },
	{ value: "imperial", label: "Feet and pounds" },
] as const;
const weekOptions = [
	{ value: "monday", label: "Monday" },
	{ value: "sunday", label: "Sunday" },
] as const;
const genderOptions = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "other", label: "Other" },
] as const;
const currencyOptions = [{ value: CURRENCY.code, label: "Pakistani rupee (PKR)" }];

const feet = (cm: number) => {
	const inches = Math.round(cm / CM_PER_INCH);
	return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
};

/** Saves one answer on the phone and to the account, like onboarding does. */
function saveAnswer<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
	useOnboardingStore.getState().set(key, value);
	useOnboardingProgress
		.getState()
		.persistAnswers()
		.catch((error: unknown) => console.error(`Could not save ${String(key)}`, error));
}

/** Settings: everything about you the app plans with, and how the app looks and counts. */
export function SettingsScreen() {
	const { preference, setPreference } = usePoTheme();
	const answers = useOnboardingStore();
	const weekStart = useProfileStore((state) => state.data.weekStart);
	const updateProfile = useProfileStore((state) => state.update);
	const hydrateProfile = useProfileStore((state) => state.hydrate);
	const [sheet, setSheet] = useState<OpenSheet>(null);
	const close = () => setSheet(null);
	const metric = answers.heightUnit === "cm";
	const { birthday } = answers;
	const now = useNow();

	useEffect(() => {
		hydrateProfile().catch((error: unknown) => console.error("Could not load settings", error));
	}, [hydrateProfile]);

	return (
		<ModuleScreen label="Settings" tab="profile" onHome={() => router.dismissTo("/")}>
			<ScreenTitle eyebrow="You and the app" title="Settings" />

			<SectionLabel>About you</SectionLabel>
			<SettingsCard>
				<SettingsRow
					icon="Users"
					title="Height"
					value={metric ? `${answers.heightCm} cm` : feet(answers.heightCm)}
					onPress={() => setSheet("height")}
				/>
				<SettingsRow
					icon="Dumbbell"
					title="Weight"
					value={
						answers.weightUnit === "kg"
							? `${answers.weightKg} kg`
							: `${Math.round(answers.weightKg / KG_PER_LB)} lb`
					}
					onPress={() => setSheet("weight")}
				/>
				<SettingsRow
					icon="Filled/Calendar"
					title="Birthday"
					value={`${birthday.day} ${MONTHS[birthday.month - 1] ?? ""} ${birthday.year} · ${ageFromBirthday(birthday, now)}`}
					onPress={() => setSheet("birthday")}
				/>
				<SettingsRow
					icon="Filled/User"
					title="Gender"
					value={
						genderOptions.find((option) => option.value === answers.gender)?.label ?? "Not set"
					}
					onPress={() => setSheet("gender")}
				/>
			</SettingsCard>
			<PoText variant="meta13" tone="textTertiary" style={styles.note}>
				Used for your calories, water and training targets.
			</PoText>

			<SectionLabel>App</SectionLabel>
			<SettingsCard>
				<SettingsRow
					icon="Lightning"
					title="Units"
					value={unitsLabel(answers.heightUnit, answers.weightUnit)}
					onPress={() => setSheet("units")}
				/>
				<SettingsRow
					icon="Sun"
					title="Theme"
					value={themeLabel(preference)}
					onPress={() => setSheet("theme")}
				/>
				<SettingsRow
					icon="Wallet"
					title="Currency"
					value={CURRENCY.code}
					onPress={() => setSheet("currency")}
				/>
				<SettingsRow
					icon="Filled/Calendar"
					title="Week starts on"
					value={weekStartLabel(weekStart)}
					onPress={() => setSheet("week")}
				/>
			</SettingsCard>

			<MeasureSheet
				kind="height"
				visible={sheet === "height"}
				valueCm={answers.heightCm}
				valueKg={answers.weightKg}
				unit={answers.heightUnit}
				onClose={close}
			/>
			<MeasureSheet
				kind="weight"
				visible={sheet === "weight"}
				valueCm={answers.heightCm}
				valueKg={answers.weightKg}
				unit={answers.weightUnit}
				onClose={close}
			/>
			<BirthdaySheet visible={sheet === "birthday"} value={birthday} onClose={close} />
			<OptionSheet<Gender>
				visible={sheet === "gender"}
				title="Gender"
				options={genderOptions}
				value={answers.gender ?? "other"}
				onChange={(next) => saveAnswer("gender", next)}
				onClose={close}
			/>
			<OptionSheet<UnitSystem>
				visible={sheet === "units"}
				title="Units"
				options={unitOptions}
				value={unitSystem(answers.heightUnit, answers.weightUnit)}
				onChange={(system) => {
					const next = unitsFor(system);
					useOnboardingStore.getState().set("heightUnit", next.heightUnit);
					saveAnswer("weightUnit", next.weightUnit);
				}}
				onClose={close}
			/>
			<OptionSheet<ThemePreference>
				visible={sheet === "theme"}
				title="Theme"
				options={themeOptions}
				value={preference}
				onChange={setPreference}
				onClose={close}
			/>
			<OptionSheet
				visible={sheet === "currency"}
				title="Currency"
				options={currencyOptions}
				value={CURRENCY.code}
				onChange={() => undefined}
				onClose={close}
				note="Only rupees for now."
			/>
			<OptionSheet<WeekStart>
				visible={sheet === "week"}
				title="Week starts on"
				options={weekOptions}
				value={weekStart}
				onChange={(next) => updateProfile((current) => ({ ...current, weekStart: next }))}
				onClose={close}
			/>
		</ModuleScreen>
	);
}

type MeasureSheetProps = {
	kind: "height" | "weight";
	visible: boolean;
	valueCm: number;
	valueKg: number;
	unit: OnboardingAnswers["heightUnit"] | OnboardingAnswers["weightUnit"];
	onClose: () => void;
};

/** Height or weight on the same ruler as onboarding, in the person's units. */
function MeasureSheet({ kind, visible, valueCm, valueKg, unit, onClose }: MeasureSheetProps) {
	const height = kind === "height";
	const [cm, setCm] = useState(valueCm);
	const [kg, setKg] = useState(valueKg);
	useEffect(() => {
		if (!visible) return;
		setCm(valueCm);
		setKg(valueKg);
	}, [visible, valueCm, valueKg]);

	const shown = height
		? unit === "cm"
			? `${cm} cm`
			: feet(cm)
		: unit === "kg"
			? `${kg} kg`
			: `${Math.round(kg / KG_PER_LB)} lb`;

	return (
		<Sheet
			visible={visible}
			title={height ? "Height" : "Weight"}
			onClose={onClose}
			action={{
				label: "Save",
				onPress: () => {
					if (height) saveAnswer("heightCm", cm);
					else saveAnswer("weightKg", kg);
					onClose();
				},
			}}
		>
			<PoText variant="display36" style={styles.center}>
				{shown}
			</PoText>
			{height && unit === "cm" ? (
				<RulerSlider
					min={120}
					max={220}
					value={cm}
					onChange={setCm}
					accessibilityLabel="Height in centimetres"
				/>
			) : height ? (
				<RulerSlider
					min={48}
					max={86}
					value={Math.round(cm / CM_PER_INCH)}
					onChange={(inches) => setCm(Math.round(inches * CM_PER_INCH))}
					formatLabel={(inches) => `${Math.floor(inches / 12)}′${inches % 12}″`}
					accessibilityLabel="Height in feet and inches"
				/>
			) : unit === "kg" ? (
				<RulerSlider
					min={30}
					max={200}
					value={kg}
					onChange={setKg}
					accessibilityLabel="Weight in kilograms"
				/>
			) : (
				<RulerSlider
					min={70}
					max={440}
					value={Math.round(kg / KG_PER_LB)}
					onChange={(pounds) => setKg(Math.round(pounds * KG_PER_LB))}
					accessibilityLabel="Weight in pounds"
				/>
			)}
		</Sheet>
	);
}

function BirthdaySheet({
	visible,
	value,
	onClose,
}: {
	visible: boolean;
	value: OnboardingAnswers["birthday"];
	onClose: () => void;
}) {
	const [date, setDate] = useState(value);
	const now = useNow();
	useEffect(() => {
		if (visible) setDate(value);
	}, [visible, value]);
	return (
		<Sheet
			visible={visible}
			title="Birthday"
			onClose={onClose}
			action={{
				label: "Save",
				onPress: () => {
					saveAnswer("birthday", date);
					onClose();
				},
			}}
		>
			<DateWheel value={date} onChange={setDate} />
			<PoText variant="meta13" tone="textSecondary" style={styles.center}>
				{`${ageFromBirthday(date, now)} years old`}
			</PoText>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	center: { textAlign: "center" },
	note: { paddingHorizontal: 4 },
});
