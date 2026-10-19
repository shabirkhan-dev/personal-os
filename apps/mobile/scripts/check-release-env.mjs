// Runs on EAS before install (the `eas-build-pre-install` hook). A production build without an
// https API URL would ship an app that can't reach its server, so it stops here; a preview build
// only warns, since previews may point at a test server.
const profile = process.env.EAS_BUILD_PROFILE ?? "";
const url = process.env.EXPO_PUBLIC_API_URL ?? "";

function isHttps(value) {
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}

if ((profile === "production" || profile === "preview") && !isHttps(url)) {
	const message =
		`EXPO_PUBLIC_API_URL should be an https URL for the ${profile} build (got "${url}"). ` +
		`Set it in the EAS "${profile}" environment: eas env:create --environment ${profile}.`;
	if (profile === "production") {
		console.error(message);
		process.exit(1);
	}
	console.warn(`warning: ${message}`);
}
