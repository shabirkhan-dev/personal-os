import { requireOptionalNativeModule } from "expo";
import type { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

/**
 * The native speech module, or null in a build without it (Expo Go, an older APK), so those
 * builds offer typing instead of crashing on import.
 */
export const speech =
	requireOptionalNativeModule<typeof ExpoSpeechRecognitionModule>("ExpoSpeechRecognition");
