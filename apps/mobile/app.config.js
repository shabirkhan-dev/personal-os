// Per-profile Android build settings layered on top of app.json.
//
// EAS sets EAS_BUILD_PROFILE during a build. Test builds (development, preview) ship one ABI and
// compressed native libraries so the APK stays small. The GitHub release ("release") is one APK
// for every Android device: 64- and 32-bit ARM phones plus x86 emulators and Chromebooks, with
// compressed native libraries. Production is an AAB, which Google Play already splits per device.
// Local `expo run:android` (no profile) keeps the defaults so emulators still work.

const SIDELOADED_PROFILES = new Set(["development", "preview"]);
const ALL_ABIS = ["arm64-v8a", "armeabi-v7a", "x86_64", "x86"];

/** @param {{ config: import("expo/config").ExpoConfig }} context */
module.exports = ({ config }) => {
	const profile = process.env.EAS_BUILD_PROFILE;
	const sideloaded = profile !== undefined && SIDELOADED_PROFILES.has(profile);

	const android = {
		// Health Connect needs Android 8 (API 26) or newer.
		minSdkVersion: 26,
		enableMinifyInReleaseBuilds: true,
		enableShrinkResourcesInReleaseBuilds: true,
		// A dependency brings Bouncy Castle, whose post-quantum tables (about 1.2 MB) the app never
		// uses; only those data files are left out, not its classes.
		packagingOptions: { exclude: ["org/bouncycastle/pqc/**"] },
		...(sideloaded ? { buildArchs: ["arm64-v8a"], useLegacyPackaging: true } : {}),
		...(profile === "release" ? { buildArchs: ALL_ABIS, useLegacyPackaging: true } : {}),
	};

	return {
		...config,
		plugins: [
			...(config.plugins ?? []),
			["expo-build-properties", { android }],
			"./plugins/with-release-signing",
		],
	};
};
