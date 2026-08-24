/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	testMatch: ["**/*.test.ts?(x)"],
	moduleNameMapper: {
		"\\.(css)$": "<rootDir>/tests/stubs/empty-module.js",
		"^@/assets/(.*)$": "<rootDir>/assets/$1",
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns: [
		// Bun extracts packages to `node_modules/.bun/<pkg>@<version>+<hash>/node_modules/<pkg>`.
		// The `(?!\.bun)` guard stops the outer segment from matching store paths so the
		// exception list is evaluated against the real package directory after the store prefix.
		"node_modules/(?!\\.bun)(?:\\.bun/[^/]+/node_modules/)?(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))",
	],
};
