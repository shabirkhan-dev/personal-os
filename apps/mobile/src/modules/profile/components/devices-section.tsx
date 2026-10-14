import { Platform } from "react-native";
import { LogoMark } from "@/components/icons";
import { useMicPermission } from "@/modules/onboarding/hooks/use-mic-permission";
import { healthName, micAction } from "../lib/labels";
import { RowPill, SettingsCard, SettingsRow, SoonTag } from "./settings-list";

/**
 * HEY OS & DEVICES. Only the microphone is real today; voice wake, the desktop app, health,
 * calendar and watch connections do not exist yet, so they say "Soon".
 */
export function DevicesSection() {
	const mic = useMicPermission();
	const micRow = micAction(mic.state);

	return (
		<SettingsCard>
			<SettingsRow
				icon="Mic"
				iconTone="statusViolet"
				tileTone="statusVioletSubtle"
				title="Microphone"
				meta={micRow.meta}
				accessory={
					micRow.action ? (
						<RowPill
							label={micRow.action}
							accessibilityLabel={
								mic.state === "blocked" ? "Open Settings for the microphone" : "Allow microphone"
							}
							onPress={() => {
								mic
									.request()
									.catch((error: unknown) =>
										console.error("Could not ask for the microphone", error),
									);
							}}
						/>
					) : mic.state === "granted" ? (
						<RowPill label="On" />
					) : null
				}
			/>
			<SettingsRow
				icon="Mic"
				iconTone="statusViolet"
				tileTone="statusVioletSubtle"
				title="Hey OS voice wake"
				meta="Wake Personal OS with your voice"
				accessory={<SoonTag />}
			/>
			<SettingsRow
				icon="Layers"
				mark={<LogoMark size={40} />}
				title="Hey OS desktop"
				meta="Mac and PC app"
				accessory={<SoonTag />}
			/>
			<SettingsRow
				icon="Heart"
				iconTone="statusDanger"
				title={healthName(Platform.OS)}
				meta="Steps, sleep and workouts"
				accessory={<SoonTag />}
			/>
			<SettingsRow
				icon="Filled/Calendar"
				iconTone="accentDefault"
				tileTone="accentSubtle"
				title="Calendar"
				meta="Your events on Today"
				accessory={<SoonTag />}
			/>
			<SettingsRow icon="Clock" title="Smartwatch" meta="Not connected" accessory={<SoonTag />} />
		</SettingsCard>
	);
}
