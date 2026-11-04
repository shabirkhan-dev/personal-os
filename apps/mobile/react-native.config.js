// Apple Health (and the Nitro runtime it needs) is iPhone-only: keep it out of the Android build.
const iosOnly = { platforms: { android: null } };

module.exports = {
	dependencies: {
		"@kingstinct/react-native-healthkit": iosOnly,
		"@react-native-healthkit/core": iosOnly,
		"react-native-nitro-modules": iosOnly,
	},
};
