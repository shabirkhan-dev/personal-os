import * as Location from "expo-location";
import type { Place } from "../lib/prayer-times";

/** The person's place for prayer times and the Qibla. Asked only when they tap Use my location. */

export type LocationResult =
	| { ok: true; place: Place }
	| { ok: false; reason: "denied" | "unavailable" };

export async function currentPlace(): Promise<LocationResult> {
	const permission = await Location.requestForegroundPermissionsAsync();
	if (!permission.granted) return { ok: false, reason: "denied" };
	try {
		const position =
			(await Location.getLastKnownPositionAsync({ maxAge: 6 * 60 * 60_000 })) ??
			(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
		const { latitude, longitude } = position.coords;
		return { ok: true, place: { latitude, longitude, name: await placeName(latitude, longitude) } };
	} catch (error) {
		console.warn("[faith] could not read the location", error);
		return { ok: false, reason: "unavailable" };
	}
}

async function placeName(latitude: number, longitude: number): Promise<string> {
	try {
		const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
		return address?.city ?? address?.subregion ?? address?.region ?? "your location";
	} catch (error) {
		// Naming the place needs the network; the coordinates are all the times need.
		if (__DEV__) console.warn("[faith] could not name the place", error);
		return "your location";
	}
}
