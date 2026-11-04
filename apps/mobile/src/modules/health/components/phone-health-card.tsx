import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useHealthSync } from "../hooks/use-health-sync";
import type { ReadingKind } from "../lib/health-model";
import type { SyncReport } from "../services/health-sync";
import { Card, CardHead, SmallButton } from "./health-cards";

const since = (at: string | null) => {
	if (!at) return "Not synced yet";
	const minutes = Math.round((Date.now() - Date.parse(at)) / 60_000);
	if (minutes < 1) return "Synced just now";
	if (minutes < 60) return `Synced ${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	return hours < 24 ? `Synced ${hours} h ago` : `Synced ${Math.round(hours / 24)} days ago`;
};

/** How each kind reads in the summary, for one and for many. */
const FOUND: [ReadingKind, string, string][] = [
	["steps", "day of steps", "days of steps"],
	["sleep", "night of sleep", "nights of sleep"],
	["heart-rate", "day of heart rate", "days of heart rate"],
	["resting-hr", "resting heart rate", "resting heart rates"],
	["hrv", "HRV reading", "HRV readings"],
	["spo2", "oxygen reading", "oxygen readings"],
	["bp", "blood pressure", "blood pressures"],
	["blood-sugar", "sugar reading", "sugar readings"],
	["temperature", "temperature", "temperatures"],
	["weight", "weight", "weights"],
];

/** "Found 30 days of steps, 12 nights of sleep" or, with nothing, where to look. */
export function reportLine(report: SyncReport, store: string): string {
	if (report.allowed === 0) return `Health can't read anything yet. Tap Choose data and allow it.`;
	const parts = FOUND.flatMap(([kind, one, many]) => {
		const count = report.found[kind] ?? 0;
		return count > 0 ? [`${count} ${count === 1 ? one : many}`] : [];
	});
	if (parts.length === 0) {
		return store === "Health Connect"
			? "Nothing in Health Connect for the last 30 days. In Samsung Health (or your watch's app), open Settings › Health Connect and turn on sharing, then Sync now."
			: "Nothing in Apple Health for the last 30 days.";
	}
	return `Found ${parts.join(", ")} from the last 30 days.`;
}

/**
 * Phone and watch data through Health Connect (Android) or Apple Health (iPhone): connect once,
 * then it syncs on its own. Hidden where the phone has no health store.
 */
export function PhoneHealthCard() {
	const health = useHealthSync();
	const { store, status } = health;
	if (!store || status === null || status === "unsupported") return null;

	if (status === "needs-app") {
		return (
			<Card>
				<CardHead title="Phone and watch data" />
				<PoText variant="meta13" tone="textSecondary">
					{`${store.name} needs to be installed or updated first.`}
				</PoText>
				<PillButton label={`Open ${store.name}`} variant="secondary" onPress={store.openSettings} />
			</Card>
		);
	}

	if (!health.enabled) {
		return (
			<Card>
				<CardHead title="Phone and watch data" />
				<PoText variant="meta13" tone="textSecondary">
					{store.name === "Apple Health"
						? "Steps, sleep, heart rate, blood pressure and more from your iPhone, Apple Watch and the apps that write to Apple Health."
						: "Steps, sleep, heart rate, blood pressure and more from Samsung Health, Fitbit, Garmin, Oura and other apps that use Health Connect."}
				</PoText>
				<PillButton label={`Connect ${store.name}`} onPress={() => void health.connect()} />
				{health.error ? (
					<PoText variant="meta13" tone="textDanger">
						{health.error}
					</PoText>
				) : null}
			</Card>
		);
	}

	return (
		<Card>
			<CardHead title={store.name} right={health.syncing ? "Syncing…" : since(health.lastSyncAt)} />
			<View style={styles.row}>
				<SmallButton label="Sync now" primary onPress={() => void health.sync()} />
				<SmallButton label="Choose data" onPress={store.openSettings} />
				<SmallButton label="Stop" onPress={health.disconnect} />
			</View>
			{health.report && !health.syncing ? (
				<PoText variant="meta13" tone="textSecondary">
					{reportLine(health.report, store.name)}
				</PoText>
			) : null}
			{health.report && health.report.failed.length > 0 ? (
				<PoText variant="meta13" tone="textWarning">
					{`Couldn't read ${health.report.failed.length === 1 ? "one type" : `${health.report.failed.length} types`} this time. They'll be tried again.`}
				</PoText>
			) : null}
			{health.error ? (
				<PoText variant="meta13" tone="textDanger">
					{health.error}
				</PoText>
			) : null}
		</Card>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
});
