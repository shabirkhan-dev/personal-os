import * as Location from "expo-location";
import { Platform } from "react-native";

/** Where the person is: prayer times, the Qibla and the weather all start from it. */
import type { Place } from "@personal-os/domain/place";

export type { Place };

/**
 * The person's place, asked only when they tap Use my location.
 *
 * Every native call has a time limit: on Android, a GPS fix indoors or the system geocoder can
 * wait forever without failing, which left the screen stuck with no error. A coarse network fix
 * is plenty for prayer times (a few km changes them by seconds), so that is tried first.
 */

export type LocateStage = "asking" | "turning-on" | "finding" | "naming";

export type LocationFailure = "denied" | "services-off" | "timeout" | "unavailable";

export type LocationResult = { ok: true; place: Place } | { ok: false; reason: LocationFailure };

const FIX_TIMEOUT_MS = 12_000;
const PRECISE_TIMEOUT_MS = 20_000;
const NAME_TIMEOUT_MS = 5_000;

export const LOCATE_STAGE_LABEL: Record<LocateStage, string> = {
	asking: "Asking for location…",
	"turning-on": "Turning on location…",
	finding: "Finding where you are…",
	naming: "Working out your prayer times…",
};

export const LOCATE_FAILURE_MESSAGE: Record<LocationFailure, string> = {
	denied: "Location is off for Personal OS. Allow it in Settings, or set the times yourself.",
	"services-off":
		"Your phone's location is turned off. Turn it on in quick settings and try again.",
	timeout: "Couldn't get a fix in time. Step near a window or turn on Wi-Fi, then try again.",
	unavailable: "Couldn't find you just now. Try again, or set the times yourself.",
};

class TimeoutError extends Error {
	constructor(what: string) {
		super(`${what} timed out`);
		this.name = "TimeoutError";
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new TimeoutError(what)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function servicesOn(onStage: (stage: LocateStage) => void): Promise<boolean> {
	if (await Location.hasServicesEnabledAsync()) return true;
	if (Platform.OS !== "android") return false;
	onStage("turning-on");
	try {
		// Shows Android's "Turn on location" dialog.
		await Location.enableNetworkProviderAsync();
		return await Location.hasServicesEnabledAsync();
	} catch (error) {
		console.warn("[faith] location services stayed off", error);
		return false;
	}
}

async function position(): Promise<Location.LocationObject> {
	const recent = await Location.getLastKnownPositionAsync({ maxAge: 24 * 60 * 60_000 });
	if (recent) return recent;
	try {
		return await withTimeout(
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
			FIX_TIMEOUT_MS,
			"network fix",
		);
	} catch (error) {
		console.warn("[faith] network fix failed, trying GPS", error);
		return withTimeout(
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
			PRECISE_TIMEOUT_MS,
			"GPS fix",
		);
	}
}

export async function currentPlace(
	onStage: (stage: LocateStage) => void = () => undefined,
): Promise<LocationResult> {
	onStage("asking");
	try {
		const permission = await Location.requestForegroundPermissionsAsync();
		if (!permission.granted) return { ok: false, reason: "denied" };
		if (!(await servicesOn(onStage))) return { ok: false, reason: "services-off" };
		onStage("finding");
		const { latitude, longitude } = (await position()).coords;
		onStage("naming");
		return { ok: true, place: { latitude, longitude, name: await placeName(latitude, longitude) } };
	} catch (error) {
		console.warn("[faith] could not read the location", error);
		return { ok: false, reason: error instanceof TimeoutError ? "timeout" : "unavailable" };
	}
}

async function placeName(latitude: number, longitude: number): Promise<string> {
	try {
		const [address] = await withTimeout(
			Location.reverseGeocodeAsync({ latitude, longitude }),
			NAME_TIMEOUT_MS,
			"place name",
		);
		return address?.city ?? address?.subregion ?? address?.region ?? "your location";
	} catch (error) {
		// Naming the place needs the network; the coordinates are all the times need.
		if (__DEV__) console.warn("[faith] could not name the place", error);
		return "your location";
	}
}
