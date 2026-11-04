import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useHealthSync } from "../hooks/use-health-sync";
import { Card, CardHead, SmallButton } from "./health-cards";

const since = (at: string | null) => {
	if (!at) return "Not synced yet";
	const minutes = Math.round((Date.now() - Date.parse(at)) / 60_000);
	if (minutes < 1) return "Synced just now";
	if (minutes < 60) return `Synced ${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	return hours < 24 ? `Synced ${hours} h ago` : `Synced ${Math.round(hours / 24)} days ago`;
};

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
