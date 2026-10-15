import { Platform } from "react-native";
import { LogoMark } from "@/components/icons";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import type { WakeStatus } from "@/lib/voice";
import { useHeyOsSettings, useHeyOsStatus } from "@/modules/home/store/hey-os";
import { useMicPermission } from "@/modules/onboarding/hooks/use-mic-permission";
import { healthName, micAction } from "../lib/labels";
import { RowPill, SettingsCard, SettingsRow, SoonTag } from "./settings-list";

/**
 * HEY OS & DEVICES. The microphone and "Hey OS" (while the app is open) are real; the desktop
 * app, health, calendar and watch connections do not exist yet, so they say "Soon".
 */
export function DevicesSection() {
	const mic = useMicPermission();
	const micRow = micAction(mic.state);
	const heyOs = useHeyOsSettings((state) => state.data);
	const updateHeyOs = useHeyOsSettings((state) => state.update);
	const wakeStatus = useHeyOsStatus((state) => state.status);
	const setHeyOs = (enabled: boolean) => {
		haptics.select();
		updateHeyOs(() => ({ enabled }));
	};

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
				title="Hey OS"
				meta={heyOsMeta(heyOs.enabled, wakeStatus)}
				accessory={
					<Toggle
						value={heyOs.enabled}
						accessibilityLabel="Listen for Hey OS"
						onChange={(on) => {
							if (!on) {
								setHeyOs(false);
								return;
							}
							mic
								.request()
								.then((granted) => setHeyOs(granted))
								.catch((error: unknown) =>
									console.error("Could not ask for the microphone", error),
								);
						}}
					/>
				}
			/>
			{Platform.OS === "android" ? (
				<SettingsRow
					icon="Lightning"
					title="Talk to OS shortcut"
					meta="Long-press the Personal OS icon, then Talk to OS. Drag it to your home screen for one tap."
				/>
			) : null}
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

/** What the Hey OS row says under its title. */
function heyOsMeta(enabled: boolean, status: WakeStatus): string {
	if (!enabled) return "Say “Hey OS” while the app is open to talk hands-free";
	switch (status) {
		case "listening":
			return "Listening for “Hey OS” · the mic stays on while the app is open";
		case "denied":
			return "Allow the microphone to use Hey OS";
		case "unavailable":
			return "This phone has no speech recognition, or this build needs updating";
		case "error":
			return "Couldn't listen just now; trying again";
		default:
			return "Paused while another mic is in use";
	}
}
