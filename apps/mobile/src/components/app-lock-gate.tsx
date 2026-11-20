import { type ReactNode, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { LogoMark } from "@/components/icons/logo-mark";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { useAppLock } from "@/lib/security/app-lock";
import { usePoTheme } from "@/theme";

/**
 * Shows the app only once it's unlocked (when App lock is on), and covers it while the app is
 * in the background or switching, so its content never shows in the app switcher.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
	const { colors } = usePoTheme();
	const { hydrated, locked, settings, hydrate, left, returned, unlock } = useAppLock();
	const [away, setAway] = useState(false);
	const [failed, setFailed] = useState(false);
	const asking = useRef(false);

	useEffect(() => {
		hydrate().catch((error: unknown) => {
			// Never leave the app covered because the lock couldn't start.
			console.warn("[lock] could not start", error);
			useAppLock.setState({ hydrated: true, locked: false });
		});
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") {
				setAway(false);
				returned();
			} else {
				setAway(true);
				if (state === "background") left();
			}
		});
		return () => subscription.remove();
	}, [hydrate, left, returned]);

	const ask = () => {
		if (asking.current) return;
		asking.current = true;
		setFailed(false);
		unlock()
			.then((ok) => setFailed(!ok))
			.catch((error: unknown) => {
				console.warn("[lock] unlock failed", error);
				setFailed(true);
			})
			.finally(() => {
				asking.current = false;
			});
	};

	// Ask as soon as the lock shows, and again each time the app comes back locked.
	useEffect(() => {
		if (hydrated && locked && !away) ask();
		// oxlint-disable-next-line react/exhaustive-deps -- ask once per lock
	}, [hydrated, locked, away]);

	const covered = !hydrated || locked || (away && (settings.enabled || settings.privacy));
	return (
		<View style={styles.root}>
			{children}
			{covered ? (
				<View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: colors.bgApp }]}>
					<LogoMark size={56} />
					{hydrated && locked ? (
						<>
							<PoText variant="title18">Personal OS is locked</PoText>
							<PoText variant="meta13" tone="textSecondary" style={styles.center}>
								{failed
									? "That didn't work. Try again."
									: "Unlock with your fingerprint, face or passcode."}
							</PoText>
							<PillButton label="Unlock" onPress={ask} style={styles.button} />
						</>
					) : null}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	cover: { alignItems: "center", justifyContent: "center", gap: 14, padding: 32, zIndex: 100 },
	center: { textAlign: "center" },
	button: { alignSelf: "stretch", marginTop: 8 },
});
