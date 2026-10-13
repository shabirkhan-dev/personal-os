// Per-profile Android build settings layered on top of app.json.
//
// EAS sets EAS_BUILD_PROFILE during a build. Sideloaded builds (development, preview) ship one
// ABI and compressed native libraries so the APK stays small; current Android phones (including
// the Galaxy S2x line) are arm64-v8a. Production is an AAB, which Google Play already splits per
// device, so it keeps every ABI. Local `expo run:android` (no profile) keeps the defaults so
// emulators still work.

const SIDELOADED_PROFILES = new Set(["development", "preview"]);

/** @param {{ config: import("expo/config").ExpoConfig }} context */
module.exports = ({ config }) => {
	const profile = process.env.EAS_BUILD_PROFILE;
	const sideloaded = profile !== undefined && SIDELOADED_PROFILES.has(profile);

	const android = {
		enableMinifyInReleaseBuilds: true,
		enableShrinkResourcesInReleaseBuilds: true,
		...(sideloaded ? { buildArchs: ["arm64-v8a"], useLegacyPackaging: true } : {}),
	};

	return {
		...config,
		plugins: [...(config.plugins ?? []), ["expo-build-properties", { android }]],
	};
};
