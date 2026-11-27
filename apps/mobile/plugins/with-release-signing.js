// Signs Android release builds with the project's own release key when one is provided, instead
// of the shared debug key Expo's generated project uses. The key never lives in the repository:
// the release workflow writes it from a GitHub secret and points these variables at it.
//
//   ANDROID_KEYSTORE_PATH       the PKCS12 keystore file
//   ANDROID_KEYSTORE_PASSWORD   its password (PKCS12 uses the same one for the key)
//   ANDROID_KEY_ALIAS           the key's alias, "personal-os" unless set
//
// Without ANDROID_KEYSTORE_PATH the build stays on the debug key, so local and E2E builds work.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARK = "// personal-os: release signing";

const SIGNING_CONFIG = `
        ${MARK}
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storeType "pkcs12"
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "personal-os"
                keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }`;

/** @param {string} gradle */
function addReleaseSigning(gradle) {
	if (gradle.includes(MARK)) return gradle;
	const withConfig = gradle.replace(/signingConfigs\s*\{/, (found) => `${found}${SIGNING_CONFIG}`);
	const withRelease = withConfig.replace(
		/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
		'$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
	);
	if (withConfig === gradle || withRelease === withConfig) {
		throw new Error("with-release-signing: app/build.gradle no longer has the expected shape");
	}
	return withRelease;
}

/** @param {import("expo/config").ExpoConfig} config */
module.exports = (config) =>
	withAppBuildGradle(config, (mod) => {
		mod.modResults.contents = addReleaseSigning(mod.modResults.contents);
		return mod;
	});
module.exports.addReleaseSigning = addReleaseSigning;
