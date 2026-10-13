const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch only this app + shared packages. Sibling apps (nest-api, web, docs, rust)
// emit/delete dist/.next/target while Turbo runs, which crashes Metro's watcher.
config.watchFolders = [projectRoot, path.resolve(monorepoRoot, "packages")];

const ignoreSiblingApps = [
	/[\\/]apps[\\/]nest-api[\\/].*/,
	/[\\/]apps[\\/]docs[\\/].*/,
	/[\\/]apps[\\/]web[\\/].*/,
	/[\\/]apps[\\/]rust[\\/].*/,
	/[\\/]apps[\\/]design-system[\\/].*/,
	// Build output folders — but only outside node_modules, since many npm
	// packages (e.g. whatwg-fetch) ship their code in a dist/ directory.
	/^(?![\s\S]*[\\/]node_modules[\\/])[\s\S]*[\\/]\.next[\\/].*/,
	/^(?![\s\S]*[\\/]node_modules[\\/])[\s\S]*[\\/]dist[\\/].*/,
	/^(?![\s\S]*[\\/]node_modules[\\/])[\s\S]*[\\/]target[\\/].*/,
];

const existingBlockList = config.resolver.blockList;
config.resolver.blockList = existingBlockList
	? [existingBlockList, ...ignoreSiblingApps].flat()
	: ignoreSiblingApps;

// `bun run preview:web` (PO_WEB_PREVIEW=1) skips Uniwind: its react-native-web shim hits a
// circular import on web. The onboarding screens use StyleSheet + tokens, so they render as-is.
module.exports = process.env.PO_WEB_PREVIEW
	? config
	: withUniwindConfig(config, {
			cssEntryFile: "./src/global.css",
			dtsFile: "./src/uniwind-types.d.ts",
		});
