import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { Toggle } from "@/components/ui/toggle";
import { haptics } from "@/lib/haptics";
import * as SecureStore from "@/lib/secure-store";
import {
	authenticate,
	LOCK_AFTER_CHOICES,
	type LockSupport,
	lockSupport,
	useAppLock,
} from "@/lib/security/app-lock";
import { usePoTheme } from "@/theme";
import { SectionLabel } from "./settings-list";

const afterLabel = (seconds: number) =>
	seconds === 0 ? "Every time" : seconds < 60 ? `${seconds} s` : `After ${seconds / 60} min`;

/**
 * Settings · Security: App lock with the phone's fingerprint, face or passcode, how soon it locks
 * again, privacy mode, and whether the data on this phone is encrypted.
 */
export function SecurityScreen() {
	const { colors } = usePoTheme();
	const { settings, update } = useAppLock();
	const [support, setSupport] = useState<LockSupport | null>(null);
	const [encrypted, setEncrypted] = useState<boolean | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		lockSupport()
			.then(setSupport)
			.catch((error: unknown) => console.warn("[lock] could not check the phone", error));
		SecureStore.getItemAsync("personal-os.db.encrypted")
			.then((value) => setEncrypted(value === "1"))
			.catch((error: unknown) => console.warn("[lock] could not read encryption state", error));
	}, []);

	const save = (change: Parameters<typeof update>[0]) =>
		update(change).catch((error: unknown) => {
			console.error("[lock] could not save", error);
			setNotice("Couldn't save on this phone. Try again.");
		});

	const setLock = async (on: boolean) => {
		setNotice(null);
		if (on && !support?.available) {
			setNotice(support?.reason ?? "This phone can't lock apps.");
			return;
		}
		// Turning it on or off needs the person themselves.
		if (!(await authenticate(on ? "Turn on App lock" : "Turn off App lock"))) return;
		haptics.success();
		await save({ enabled: on });
	};

	return (
		<ModuleScreen label="Security" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={[styles.hero, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="eyebrow11" tone={encrypted ? "statusSuccess" : "textTertiary"}>
					{encrypted
						? "ENCRYPTED ON THIS PHONE"
						: Platform.OS === "web"
							? "WEB PREVIEW"
							: "ENCRYPTING…"}
				</PoText>
				<PoText variant="title30">Keep it yours</PoText>
				<PoText variant="body15" tone="textSecondary">
					Everything you keep here (health, money, prayers, notes) is stored encrypted on this
					phone, with a key only this phone holds. Add App lock so no one else can open it.
				</PoText>
			</View>

			<SectionLabel>App lock</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<View style={styles.row}>
					<View style={styles.flex}>
						<PoText variant="row15">Lock Personal OS</PoText>
						<PoText variant="meta13" tone="textTertiary">
							{support && !support.available
								? support.reason
								: "Fingerprint, face or your phone's passcode to open it"}
						</PoText>
					</View>
					<Toggle
						value={settings.enabled}
						accessibilityLabel="Lock Personal OS"
						onChange={(on) => void setLock(on)}
					/>
				</View>
				{settings.enabled ? (
					<>
						<PoText variant="meta13" tone="textSecondary">
							Lock again when I've been away
						</PoText>
						<View style={styles.chips}>
							{LOCK_AFTER_CHOICES.map((seconds) => (
								<FilterChip
									key={seconds}
									label={afterLabel(seconds)}
									selected={settings.after === seconds}
									onPress={() => void save({ after: seconds })}
								/>
							))}
						</View>
					</>
				) : null}
			</View>

			<SectionLabel>Privacy</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<View style={styles.row}>
					<View style={styles.flex}>
						<PoText variant="row15">Hide in recent apps</PoText>
						<PoText variant="meta13" tone="textTertiary">
							{Platform.OS === "android"
								? "A blank card in the app switcher, and screenshots are blocked"
								: "Covers the app in the app switcher"}
						</PoText>
					</View>
					<Toggle
						value={settings.privacy}
						accessibilityLabel="Hide in recent apps"
						onChange={(privacy) => void save({ privacy })}
					/>
				</View>
			</View>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
			<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
				Backups you save are plain files so they open anywhere: keep them somewhere private.
			</PoText>
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	hero: { gap: 10, padding: 20, borderRadius: 24 },
	card: { gap: 14, padding: 16, borderRadius: 20 },
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	flex: { flex: 1, minWidth: 0, gap: 2 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	pad: { paddingHorizontal: 8 },
});
