// Adds a "Talk to OS" launcher shortcut on Android: long-press the app icon, or drag it to the
// home screen. It opens personalos://listen, which starts listening straight away.
const fs = require("node:fs");
const path = require("node:path");
const {
	AndroidConfig,
	withAndroidManifest,
	withDangerousMod,
	withStringsXml,
} = require("expo/config-plugins");

const SHORT_LABEL = "talk_shortcut_short";
const LONG_LABEL = "talk_shortcut_long";

function shortcutsXml(packageName, scheme) {
	return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
      android:shortcutId="talk"
      android:enabled="true"
      android:icon="@mipmap/ic_launcher"
      android:shortcutShortLabel="@string/${SHORT_LABEL}"
      android:shortcutLongLabel="@string/${LONG_LABEL}">
    <intent
        android:action="android.intent.action.VIEW"
        android:data="${scheme}://listen"
        android:targetPackage="${packageName}"
        android:targetClass="${packageName}.MainActivity" />
  </shortcut>
</shortcuts>
`;
}

module.exports = function withTalkShortcut(config) {
	const packageName = config.android?.package;
	const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
	if (!packageName || !scheme) {
		throw new Error("with-talk-shortcut needs android.package and scheme in app.json");
	}

	config = withStringsXml(config, (mod) => {
		mod.modResults = AndroidConfig.Strings.setStringItem(
			[
				{ $: { name: SHORT_LABEL, translatable: "false" }, _: "Talk to OS" },
				{ $: { name: LONG_LABEL, translatable: "false" }, _: "Talk to Personal OS" },
			],
			mod.modResults,
		);
		return mod;
	});

	config = withAndroidManifest(config, (mod) => {
		const activity = AndroidConfig.Manifest.getMainActivityOrThrow(mod.modResults);
		const meta = (activity["meta-data"] ??= []);
		if (!meta.some((item) => item.$["android:name"] === "android.app.shortcuts")) {
			meta.push({
				$: { "android:name": "android.app.shortcuts", "android:resource": "@xml/shortcuts" },
			});
		}
		return mod;
	});

	return withDangerousMod(config, [
		"android",
		(mod) => {
			const folder = path.join(mod.modRequest.platformProjectRoot, "app/src/main/res/xml");
			fs.mkdirSync(folder, { recursive: true });
			fs.writeFileSync(path.join(folder, "shortcuts.xml"), shortcutsXml(packageName, scheme));
			return mod;
		},
	]);
};
