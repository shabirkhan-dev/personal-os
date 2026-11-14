import { parseDsn, sendErrorReport } from "@personal-os/domain/error-report";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Crash reports from the app, sent to the project set in EXPO_PUBLIC_SENTRY_DSN at build time.
 * Without it nothing leaves the phone. Reports carry the error, the screen and the app version,
 * never the person's records.
 */

const dsn = parseDsn(process.env.EXPO_PUBLIC_SENTRY_DSN);
const release = Constants.expoConfig?.version ? `app@${Constants.expoConfig.version}` : null;
const environment = __DEV__ ? "development" : "production";
const recent = new Map<string, number>();
const REPEAT_MS = 60_000;

export function reportAppError(error: unknown, tags: Record<string, string> = {}): void {
	if (!dsn || __DEV__) return;
	// The same failure over and over (a render loop) is reported once a minute.
	const key = `${error instanceof Error ? error.message : String(error)}|${tags.where ?? ""}`;
	const now = Date.now();
	if ((recent.get(key) ?? 0) > now - REPEAT_MS) return;
	recent.set(key, now);
	void sendErrorReport(dsn, error, {
		environment,
		release,
		tags: { service: "app", platform: Platform.OS, ...tags },
	});
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsShape = {
	getGlobalHandler: () => GlobalHandler;
	setGlobalHandler: (handler: GlobalHandler) => void;
};

/** Reports uncaught errors, then lets React Native handle them as before. */
export function installCrashReporting(): void {
	const utils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
	if (!dsn || !utils) return;
	const previous = utils.getGlobalHandler();
	utils.setGlobalHandler((error, isFatal) => {
		reportAppError(error, { where: isFatal ? "fatal" : "uncaught" });
		previous(error, isFatal);
	});
}
