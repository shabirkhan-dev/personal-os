import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { ModuleScreen } from "@/components/module-screen";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { ToggleRow } from "@/components/ui/toggle-row";
import { haptics } from "@/lib/haptics";
import { type ThemePreference, usePoTheme } from "@/theme";
import { type BackupFile, collectionLabel, type RestoreMode, summarize } from "../lib/backup";
import {
	type AutoBackup,
	buildBackup,
	loadAutoBackup,
	pickBackup,
	restoreBackup,
	runAutoBackup,
	saveAutoBackup,
	saveBackupToFolder,
	shareBackup,
} from "../services/backup";
import { SectionLabel } from "./settings-list";

const THEMES: ReadonlySet<string> = new Set(["system", "light", "dark"]);

function ago(iso: string | null): string {
	if (!iso) return "Not yet";
	const at = new Date(iso);
	const hours = Math.round((Date.now() - at.getTime()) / 3_600_000);
	if (hours < 1) return "Just now";
	if (hours < 24) return `${hours} h ago`;
	return at.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Settings · Backup and restore: save everything (records, documents, setup answers and photos)
 * to a file in a folder or through the share sheet, back it up daily on its own, and bring a
 * backup back on this or a new phone, merged with what's here or replacing it.
 */
export function BackupScreen() {
	const { colors, preference, setPreference } = usePoTheme();
	const [photos, setPhotos] = useState(true);
	const [busy, setBusy] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [auto, setAuto] = useState<AutoBackup | null>(null);
	const [picked, setPicked] = useState<BackupFile | null>(null);

	useEffect(() => {
		loadAutoBackup()
			.then(setAuto)
			.catch((error: unknown) => console.warn("[backup] could not read settings", error));
	}, []);

	const run = async (label: string, task: () => Promise<void>) => {
		if (busy) return;
		setBusy(label);
		setNotice(null);
		try {
			await task();
		} catch (error) {
			console.error(`[backup] ${label} failed`, error);
			setNotice("That didn't work. Try again, or pick another folder.");
		} finally {
			setBusy(null);
		}
	};

	const save = (where: "folder" | "share") =>
		run(where === "folder" ? "Saving" : "Preparing", async () => {
			const backup = await buildBackup({ photos, themePreference: preference });
			if (where === "share") {
				await shareBackup(backup);
				return;
			}
			const folder = await saveBackupToFolder(backup);
			if (!folder) return;
			haptics.success();
			setNotice(
				`Saved ${backup.name}: ${backup.records} records${backup.photos ? ` and ${backup.photos} photos` : ""}.`,
			);
		});

	const turnOnAuto = () =>
		run("Choosing a folder", async () => {
			const backup = await buildBackup({
				photos: auto?.photos ?? false,
				themePreference: preference,
			});
			const folder = await saveBackupToFolder(backup);
			if (!folder) return;
			const next = await saveAutoBackup({
				on: true,
				folder,
				lastAt: new Date().toISOString(),
				lastError: null,
			});
			setAuto(next);
			haptics.success();
			setNotice("Daily backups are on. Today's is already saved in that folder.");
		});

	const choose = () =>
		run("Opening", async () => {
			const result = await pickBackup();
			if (!result) return;
			if (!result.ok) {
				setNotice(result.reason);
				return;
			}
			setPicked(result.file);
		});

	const restore = (file: BackupFile, mode: RestoreMode) => {
		const go = () =>
			run("Restoring", async () => {
				const result = await restoreBackup(file, mode);
				if (THEMES.has(result.theme)) setPreference(result.theme as ThemePreference);
				haptics.success();
				setPicked(null);
				setNotice(
					`Restored ${result.written} records${result.photos ? ` and ${result.photos} photos` : ""}${
						result.removed ? `; removed ${result.removed} that weren't in the backup` : ""
					}.`,
				);
			});
		if (mode === "merge") {
			go();
			return;
		}
		showDialog(
			"Replace everything?",
			"What's on this phone and in your account becomes exactly what's in the backup. Anything added since it was made is deleted.",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Replace", style: "destructive", onPress: go },
			],
		);
	};

	const summary = picked ? summarize(picked) : null;
	const native = Platform.OS !== "web";

	return (
		<ModuleScreen label="Backup" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={[styles.hero, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="eyebrow11" tone="textTertiary">
					EVERYTHING, IN ONE FILE
				</PoText>
				<PoText variant="title30">Back up your life</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Every module, your setup and your photos go into one file you keep: in Downloads, on
					Drive, or anywhere you like. Bring it back here or on a new phone.
				</PoText>
				<ToggleRow
					title="Include photos"
					meta="Bigger file; meals, wardrobe, receipts and more come back too"
					value={photos}
					onChange={setPhotos}
				/>
				{native ? (
					<PillButton
						label={busy === "Saving" ? "Saving…" : "Save to a folder"}
						disabled={busy !== null}
						onPress={() => void save("folder")}
					/>
				) : null}
				<PillButton
					label={busy === "Preparing" ? "Preparing…" : "Share the backup"}
					variant="secondary"
					disabled={busy !== null}
					onPress={() => void save("share")}
				/>
				{notice ? (
					<PoText variant="meta13" tone="textSecondary">
						{notice}
					</PoText>
				) : null}
			</View>

			{native ? (
				<>
					<SectionLabel>Automatic</SectionLabel>
					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						<ToggleRow
							title="Back up every day"
							meta={
								auto?.on
									? `Last backup: ${ago(auto.lastAt)}. The newest 7 are kept.`
									: "Into a folder you pick, when you open the app"
							}
							value={auto?.on ?? false}
							onChange={(on) => {
								if (on) {
									void turnOnAuto();
									return;
								}
								saveAutoBackup({ on: false })
									.then(setAuto)
									.catch((error: unknown) => console.error("[backup] could not save", error));
							}}
						/>
						{auto?.on ? (
							<ToggleRow
								title="Photos in daily backups"
								value={auto.photos}
								onChange={(value) =>
									saveAutoBackup({ photos: value })
										.then(setAuto)
										.catch((error: unknown) => console.error("[backup] could not save", error))
								}
							/>
						) : null}
						{auto?.lastError ? (
							<PoText variant="meta13" tone="textDanger">
								{auto.lastError}
							</PoText>
						) : null}
						{auto?.on ? (
							<PillButton
								label="Back up now"
								variant="secondary"
								disabled={busy !== null}
								onPress={() =>
									void run("Backing up", async () => {
										await saveAutoBackup({ lastAt: null });
										const done = await runAutoBackup(preference);
										setAuto(await loadAutoBackup());
										if (done) setNotice("Backed up into your folder.");
									})
								}
							/>
						) : null}
					</View>
				</>
			) : null}

			<SectionLabel>Restore</SectionLabel>
			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				{summary && picked ? (
					<>
						<PoText variant="title18">
							{summary.exportedAt
								? `Backup from ${summary.exportedAt.toLocaleDateString(undefined, {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}`
								: "Backup"}
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{`${summary.records} records${summary.photos ? ` · ${summary.photos} photos` : ""}`}
						</PoText>
						{summary.largest.map((item) => (
							<View key={item.name} style={styles.line}>
								<PoText variant="meta13" style={styles.flex}>
									{collectionLabel(item.name)}
								</PoText>
								<PoText variant="meta13" tone="textTertiary">
									{item.count}
								</PoText>
							</View>
						))}
						<PillButton
							label={busy === "Restoring" ? "Restoring…" : "Add to what's here"}
							disabled={busy !== null}
							onPress={() => restore(picked, "merge")}
						/>
						<PillButton
							label="Replace everything with it"
							variant="secondary"
							disabled={busy !== null}
							onPress={() => restore(picked, "replace")}
						/>
						<PillButton
							label="Cancel"
							variant="secondary"
							disabled={busy !== null}
							onPress={() => setPicked(null)}
						/>
					</>
				) : (
					<>
						<PoText variant="meta13" tone="textSecondary">
							Pick a Personal OS backup file. You'll see what's in it before anything changes.
						</PoText>
						<PillButton
							label={busy === "Opening" ? "Opening…" : "Choose a backup file"}
							variant="secondary"
							disabled={busy !== null}
							onPress={() => void choose()}
						/>
					</>
				)}
			</View>
			<PoText variant="meta13" tone="textTertiary" style={styles.note}>
				Signed in? Your account already keeps a copy of your records. A backup file is yours to keep
				anywhere, works without an account, and also carries photos and setup.
			</PoText>
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	hero: { gap: 12, padding: 20, borderRadius: 24 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
	line: { flexDirection: "row", gap: 12 },
	flex: { flex: 1, minWidth: 0, gap: 2 },
	note: { paddingHorizontal: 8 },
});
