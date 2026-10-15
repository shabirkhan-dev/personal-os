const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch only this app + shared packages. Sibling apps (api, web, docs)
// emit/delete dist/.next/target while Turbo runs, which crashes Metro's watcher.
config.watchFolders = [projectRoot, path.resolve(monorepoRoot, "packages")];

const ignoreSiblingApps = [
	/[\\/]apps[\\/]api[\\/].*/,
	/[\\/]apps[\\/]docs[\\/].*/,
	/[\\/]apps[\\/]web[\\/].*/,
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

module.exports = config;
