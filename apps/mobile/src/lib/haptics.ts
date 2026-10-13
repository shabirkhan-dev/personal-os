import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Light haptic feedback. Fire-and-forget: a device without a vibrator, or the web preview, simply
 * stays silent, and the OS haptics setting is respected by the platform.
 */

const enabled = Platform.OS === "ios" || Platform.OS === "android";

function run(effect: () => Promise<void>): void {
	if (!enabled) return;
	effect().catch((error: unknown) => {
		if (__DEV__) console.warn("[haptics] feedback failed", error);
	});
}

export const haptics = {
	/** Buttons and taps. */
	tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
	/** Picking an option, toggling, moving a wheel or slider. */
	select: () => run(() => Haptics.selectionAsync()),
	/** A finished step: signed in, plan saved, onboarding done. */
	success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
	/** A rejected action, such as a wrong code. */
	error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
