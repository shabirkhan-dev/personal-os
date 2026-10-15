import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { useVoiceInput, type VoiceStatus } from "@/lib/voice";

export type SayItSheetProps = {
	onClose: () => void;
	/** Called with what was heard when the person taps "Use this". */
	onDone: (transcript: string) => void;
};

function statusLine(status: VoiceStatus): string {
	switch (status) {
		case "starting":
			return "Starting the microphone…";
		case "listening":
			return "Listening. Say what you ate, like “lunch biryani 700 calories”.";
		case "denied":
			return "Microphone or speech access is off. Turn it on in Settings, or type instead.";
		case "unavailable":
			return "Speech recognition isn't available on this device. Type your meal instead.";
		case "error":
			return "Something went wrong with the microphone. Try again or type instead.";
		default:
			return "Tap the mic and say what you ate.";
	}
}

/** "Say it": dictate a meal; the words go into the Log meal sheet to check before saving. */
export function SayItSheet({ onClose, onDone }: SayItSheetProps) {
	const { colors } = usePoTheme();
	const { status, transcript, start, stop, openSettings } = useVoiceInput();
	const listening = status === "listening" || status === "starting";
	const blocked = status === "denied" || status === "unavailable";

	useEffect(() => {
		start().catch((error: unknown) => console.error("Could not start dictation", error));
	}, [start]);

	const finish = () => {
		stop();
		onDone(transcript.trim());
	};

	return (
		<Sheet
			visible
			title="Say it"
			onClose={() => {
				stop();
				onClose();
			}}
			action={{
				label: transcript.trim() ? "Use this" : "Type instead",
				onPress: finish,
			}}
		>
			<View style={styles.center}>
				<View
					style={[
						styles.mic,
						{ backgroundColor: listening ? colors.accentSubtle : colors.bgSubtle },
					]}
				>
					<Icon
						name="Mic"
						size={28}
						color={listening ? colors.accentDefault : colors.textSecondary}
					/>
				</View>
				<PoText variant="meta13" tone="textSecondary" style={styles.centerText}>
					{statusLine(status)}
				</PoText>
			</View>
			<View style={[styles.transcript, { backgroundColor: colors.bgSubtle }]}>
				<PoText variant="body15" tone={transcript ? "textPrimary" : "textTertiary"}>
					{transcript || "Your words show up here."}
				</PoText>
			</View>
			{status === "denied" ? (
				<PillButton variant="secondary" label="Open Settings" onPress={openSettings} />
			) : null}
			{!blocked && !listening ? (
				<PillButton
					variant="secondary"
					label="Listen again"
					onPress={() => {
						start().catch((error: unknown) => console.error("Could not start dictation", error));
					}}
				/>
			) : null}
			{listening ? <PillButton variant="ghost" label="Stop" onPress={stop} /> : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	center: { alignItems: "center", gap: 12, paddingTop: 4 },
	centerText: { textAlign: "center" },
	mic: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
	transcript: { minHeight: 72, padding: 16, borderRadius: 16 },
});
