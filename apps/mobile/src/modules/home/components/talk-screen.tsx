import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterChip } from "@/components/module-ui";
import { HeaderButton } from "@/components/ui/header-button";
import { PoText } from "@/components/ui/po-text";
import { Glow } from "@/components/ui/glow";
import { moduleOptions, type ModuleId } from "@/modules/onboarding/lib/options";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePoTheme } from "@/theme";
import { routeLine } from "../lib/route-line";
import { useAskInbox } from "../store/ask-inbox";
import { useHomeView } from "../store/home-view";
import { AskBar } from "./ask-bar";

/** Modules whose Home takes a line from Talk to OS. */
const LISTENERS: ReadonlySet<ModuleId> = new Set<ModuleId>(["faith", "career", "fashion"]);

/**
 * Talk to OS (`personalos://listen`): opens straight into listening, works out which module the
 * line is for and hands it over, so one phrase logs a prayer or a job without finding the screen.
 */
export function TalkScreen({ say }: { say?: string }) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const modules = useOnboardingStore((state) => state.modules);
	const updateView = useHomeView((state) => state.update);
	const send = useAskInbox((state) => state.send);
	const [unsure, setUnsure] = useState<{ text: string; spoken: boolean } | null>(null);
	const choices = moduleOptions.filter(
		(option) => LISTENERS.has(option.id) && modules.includes(option.id),
	);

	const handTo = (module: ModuleId, text: string, spoken: boolean) => {
		send({ module, text, spoken });
		updateView((doc) => ({ ...doc, view: module }));
		router.dismissTo("/");
	};

	const onLine = (text: string, spoken: boolean) => {
		const target = routeLine(
			text,
			modules.filter((id) => LISTENERS.has(id)),
		);
		if (target) handTo(target, text, spoken);
		else setUnsure({ text, spoken });
	};

	// "Hey OS, prayed fajr": the words after the wake phrase are handled at once.
	const handled = useRef(false);
	useEffect(() => {
		if (!say || handled.current) return;
		handled.current = true;
		onLine(say, true);
		// oxlint-disable-next-line react/exhaustive-deps -- once, for the words that woke it
	}, [say]);

	return (
		<View style={[styles.root, { backgroundColor: colors.bgApp, paddingTop: insets.top + 6 }]}>
			<Glow tone="accentDefault" width={340} height={240} left={-90} top={-110} blur={110} />
			<View style={styles.head}>
				<HeaderButton
					accessibilityLabel="Back"
					onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
				/>
			</View>
			<View style={styles.body}>
				<PoText variant="title30" accessibilityRole="header">
					Talk to OS
				</PoText>
				<PoText variant="body15" tone="textSecondary">
					Say it like you'd type it: “prayed fajr”, “what should I wear”, “applied to Acme,
					frontend”.
				</PoText>
				<AskBar
					suggestions={[]}
					placeholder="Listening… or type here"
					autoListen={!say}
					onSubmit={onLine}
				/>
				{unsure ? (
					<View style={styles.pick}>
						<PoText variant="meta13" tone="textSecondary">
							Where should “{unsure.text}” go?
						</PoText>
						<View style={styles.chips}>
							{choices.map((option) => (
								<FilterChip
									key={option.id}
									label={option.label}
									selected={false}
									onPress={() => handTo(option.id, unsure.text, unsure.spoken)}
								/>
							))}
						</View>
						{choices.length === 0 ? (
							<PoText variant="meta13" tone="textTertiary">
								Turn on Faith, Career or Fashion in Profile to log by voice.
							</PoText>
						) : null}
					</View>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, paddingHorizontal: 16 },
	head: { flexDirection: "row", paddingBottom: 24 },
	body: { gap: 16 },
	pick: { gap: 10 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
