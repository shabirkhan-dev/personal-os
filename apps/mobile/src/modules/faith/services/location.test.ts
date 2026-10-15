import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";

/** A phone whose location calls can be scripted; `never` stands for a GPS fix that never comes. */
const never = () => new Promise<never>(() => undefined);
const phone = {
	granted: true,
	servicesOn: true,
	lastKnown: null as null | { coords: { latitude: number; longitude: number } },
	current: (): Promise<unknown> => never(),
	geocode: (): Promise<unknown> => Promise.resolve([{ city: "Gilgit" }]),
};

// React Native defines __DEV__; plain bun does not.
Object.assign(globalThis, { __DEV__: false });

mock.module("react-native", () => ({ Platform: { OS: "android" } }));
mock.module("expo-location", () => ({
	Accuracy: { Low: 2, Balanced: 3 },
	requestForegroundPermissionsAsync: () => Promise.resolve({ granted: phone.granted }),
	hasServicesEnabledAsync: () => Promise.resolve(phone.servicesOn),
	enableNetworkProviderAsync: () => Promise.reject(new Error("user said no")),
	getLastKnownPositionAsync: () => Promise.resolve(phone.lastKnown),
	getCurrentPositionAsync: () => phone.current(),
	reverseGeocodeAsync: () => phone.geocode(),
}));

const { currentPlace } = await import("./location");

/** Moves fake time on a second at a time, letting promise callbacks run in between. */
async function passSeconds(seconds: number): Promise<void> {
	if (seconds === 0) return;
	await Promise.resolve();
	jest.advanceTimersByTime(1000);
	await Promise.resolve();
	return passSeconds(seconds - 1);
}

const gilgit = { coords: { latitude: 35.92, longitude: 74.31 } };

describe("currentPlace", () => {
	beforeEach(() => {
		Object.assign(phone, {
			granted: true,
			servicesOn: true,
			lastKnown: null,
			current: never,
			geocode: () => Promise.resolve([{ city: "Gilgit" }]),
		});
	});
	afterEach(() => jest.useRealTimers());

	it("uses the last known position and names the place", async () => {
		phone.lastKnown = gilgit;
		const stages: string[] = [];
		const result = await currentPlace((stage) => stages.push(stage));
		expect(result).toEqual({
			ok: true,
			place: { latitude: 35.92, longitude: 74.31, name: "Gilgit" },
		});
		expect(stages).toEqual(["asking", "finding", "naming"]);
	});

	it("says why when permission or location services are off", async () => {
		phone.granted = false;
		expect(await currentPlace()).toEqual({ ok: false, reason: "denied" });
		phone.granted = true;
		phone.servicesOn = false;
		expect(await currentPlace()).toEqual({ ok: false, reason: "services-off" });
	});

	it("gives up on a fix that never comes instead of hanging", async () => {
		jest.useFakeTimers();
		const pending = currentPlace();
		await passSeconds(40);
		expect(await pending).toEqual({ ok: false, reason: "timeout" });
	});

	it("keeps the place when naming it hangs", async () => {
		jest.useFakeTimers();
		phone.lastKnown = gilgit;
		phone.geocode = never;
		const pending = currentPlace();
		await passSeconds(10);
		expect(await pending).toMatchObject({ ok: true, place: { name: "your location" } });
	});
});
