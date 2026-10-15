import { useDeviceVoiceInput } from "./device-voice-input";
import { deviceVoiceOutput } from "./device-voice-output";

/**
 * The engines the app uses. To move to a cloud or desktop engine, implement `VoiceInput` /
 * `VoiceOutput` (see `voice.ts`) and point these two lines at it; nothing else changes.
 */
export const useVoiceInput = useDeviceVoiceInput;
export const voiceOut = deviceVoiceOutput;
export { useDeviceWakeListener as useWakeListener } from "./device-wake-listener";
