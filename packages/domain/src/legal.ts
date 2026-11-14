/**
 * The privacy policy and terms, written once and shown in the app (Settings → Privacy policy /
 * Terms) and on the website (/privacy, /terms). Keep them true to what the code does: change
 * them in the same pull request as any change to what data is collected or where it goes.
 */

export type LegalSection = { heading: string; paragraphs: readonly string[] };
export type LegalDocument = {
	id: "privacy" | "terms";
	title: string;
	updated: string;
	intro: string;
	sections: readonly LegalSection[];
};

export const LEGAL_CONTACT = "https://github.com/shabirkhan-dev/personal-os/issues";

export const PRIVACY_POLICY: LegalDocument = {
	id: "privacy",
	title: "Privacy policy",
	updated: "14 November 2026",
	intro:
		"Personal OS keeps your plans, money, health, faith, food, care and wardrobe in one place. This policy says what the app stores, where it goes and what you control. In short: your data stays on your phone unless you sign in to back it up, it is never sold, and there are no ads or trackers.",
	sections: [
		{
			heading: "What stays on your phone",
			paragraphs: [
				"Everything you add (routines, expenses, meals, prayers, medicines, check-ins, photos and the answers from setup) is saved on your phone first, in the app's private storage. You can use the whole app without an account.",
				"Backup files you make in Settings → Backup and restore are saved where you choose (a folder or an app you share to). They are yours: the app doesn't send them anywhere else.",
			],
		},
		{
			heading: "When you sign in",
			paragraphs: [
				"Signing in with your email backs up and syncs your records and the photos you add, so they come back on a new phone. They are stored on Cloudflare (the app's server and photo storage) and Neon (the database), encrypted in transit and at rest.",
				"Your email address is used to send sign-in codes (through Resend) and nothing else. No password is stored.",
			],
		},
		{
			heading: "Assistant and AI features",
			paragraphs: [
				"When you use an AI feature (the assistant, designing a routine or meal plan, reading a receipt or a meal photo), the text or photo it needs and the relevant records are sent to the AI provider the server is set up with, only to answer that request; the provider handles them under its own API terms. AI features only work when you're signed in, and you can use the app without them.",
			],
		},
		{
			heading: "Health, location and other permissions",
			paragraphs: [
				"Health Connect (Android) and Apple Health (iPhone): the app only reads the types you allow (such as steps, sleep and heart rate) to show them in Health. It never writes to them, and health data from them is not used for ads or sold.",
				"Location is used while the app is open to work out prayer times and the Qibla direction. Only the place is saved, with your Faith settings.",
				"Camera, photos and microphone are used only when you take a photo, pick one, scan a barcode or talk to the app. Notifications are used for the reminders you turn on, and they are scheduled on your phone.",
			],
		},
		{
			heading: "What we don't do",
			paragraphs: [
				"No ads, no advertising IDs, no analytics trackers, and your data is never sold or shared for marketing.",
				"If crash reporting is switched on for a release, crash reports contain technical details about the error (device model, app version, the screen) and never the content of your records.",
			],
		},
		{
			heading: "Your choices",
			paragraphs: [
				"Export everything at any time from Settings → Backup and restore.",
				"Delete your account from Profile → Delete account: your account, synced records, photos and assistant history are removed from the server. Signing out can also erase everything from the phone.",
				"Revoke any permission in your phone's settings; the features that need it simply stop.",
			],
		},
		{
			heading: "Children",
			paragraphs: [
				"Personal OS is not meant for children under 13 and doesn't knowingly collect their data.",
			],
		},
		{
			heading: "Changes and contact",
			paragraphs: [
				"If this policy changes, the new version appears in the app and on the website with a new date.",
				"Questions or requests: open an issue on the project's GitHub page, or use Delete account in the app for anything about your data.",
			],
		},
	],
};

export const TERMS: LegalDocument = {
	id: "terms",
	title: "Terms of use",
	updated: "14 November 2026",
	intro:
		"These terms cover your use of the Personal OS app and its online services. By using the app you agree to them.",
	sections: [
		{
			heading: "Using the app",
			paragraphs: [
				"You may use Personal OS for your own, personal use. Don't misuse the service: no attempts to break, overload or reverse its security, and no automated access to the server other than through the app.",
				"You're responsible for keeping your phone and email account secure, since sign-in codes go to your email.",
			],
		},
		{
			heading: "Your content",
			paragraphs: [
				"What you add stays yours. You give the service only the permission it needs to store, sync and process it for you (for example to back it up or to answer an AI request you make).",
			],
		},
		{
			heading: "Not medical, financial or religious advice",
			paragraphs: [
				"Health readings, medicine reminders, budgets, runway estimates, prayer times, zakat figures and AI suggestions are tools to help you organise your life. They are not professional advice. Check medicines and doses with a doctor or pharmacist, money decisions with a qualified adviser, and prayer times and rulings with your local mosque or scholar.",
				"Reminders depend on your phone delivering notifications; don't rely on the app alone for anything critical.",
			],
		},
		{
			heading: "AI features",
			paragraphs: [
				"AI answers can be wrong or incomplete. Review a draft (a routine, a meal plan, a parsed receipt) before you save it.",
			],
		},
		{
			heading: "Availability and changes",
			paragraphs: [
				"The app is provided as is. Features may change, and the online services may be unavailable at times. Keep a backup file if your data matters to you.",
				"We may update these terms; the new version appears in the app with a new date.",
			],
		},
		{
			heading: "Ending",
			paragraphs: [
				"You can stop using the app and delete your account at any time. Access may be suspended for misuse of the service.",
			],
		},
	],
};

export const LEGAL_DOCUMENTS = { privacy: PRIVACY_POLICY, terms: TERMS } as const;
