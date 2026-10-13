import { textStyles } from "@personal-os/tokens";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AiInsight } from "@/modules/onboarding/components/ai-insight";
import { DateWheel } from "@/modules/onboarding/components/date-wheel";
import { FieldLabel } from "@/modules/onboarding/components/field-label";
import { SetupFrame } from "@/modules/onboarding/components/setup-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { ageFromBirthday } from "@/modules/onboarding/lib/insights";
import type { Gender } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { toTextStyle, usePoTheme } from "@/theme";

const genders = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "other", label: "Other" },
] as const satisfies readonly { value: Gender; label: string }[];

const inputStyle = toTextStyle(textStyles.body15);

/** 08 Setup 1 · About you */
export default function AboutYouScreen() {
	const { colors } = usePoTheme();
	const { name, gender, birthday, set } = useOnboardingStore();
	const [focused, setFocused] = useState(false);
	const [today] = useState(() => new Date());
	const age = ageFromBirthday(birthday, today);

	return (
		<SetupFrame
			step={1}
			route={onboardingRoutes.aboutYou}
			title="Tell us about you"
			body={["So the AI can plan days that fit you."]}
		>
			<View style={styles.form}>
				<View style={styles.group}>
					<FieldLabel label="Your name" />
					<TextInput
						value={name}
						onChangeText={(value) => set("name", value)}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						placeholder="Your name"
						placeholderTextColor={colors.textTertiary}
						selectionColor={colors.accentDefault}
						cursorColor={colors.accentDefault}
						autoCapitalize="words"
						autoComplete="name"
						textContentType="name"
						returnKeyType="done"
						accessibilityLabel="Your name"
						style={[
							inputStyle,
							styles.field,
							{
								color: colors.textPrimary,
								backgroundColor: colors.bgSurface,
								borderColor: focused ? colors.textSecondary : colors.borderDefault,
							},
						]}
					/>
				</View>
				<View style={styles.group}>
					<FieldLabel label="Gender" />
					<SegmentedControl
						options={genders}
						value={gender}
						onChange={(value) => set("gender", value)}
						accessibilityLabel="Gender"
					/>
				</View>
				<View style={styles.group}>
					<FieldLabel label="Birthday" value={`Age ${age}`} />
					<DateWheel value={birthday} onChange={(value) => set("birthday", value)} />
				</View>
			</View>
			<View style={styles.gap14} />
			<AiInsight
				parts={[`${age} years old. `, ["Sleep and heart-rate targets"], " are set for your age."]}
			/>
		</SetupFrame>
	);
}

const styles = StyleSheet.create({
	form: { gap: 18 },
	group: { gap: 8 },
	field: { height: 56, borderRadius: 28, borderWidth: 1, paddingHorizontal: 20 },
	gap14: { height: 14 },
});
