import { Linking, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { drivePreviewUrl } from "../lib/exercise-guide";

/**
 * A video kept on Google Drive, played in Drive's own player (it streams at the right quality and
 * needs the file shared as "anyone with the link"). The web preview opens Drive in a new tab.
 */
export function DrivePlayer({ link, height = 220 }: { link: string; height?: number }) {
	const { colors } = usePoTheme();
	const url = drivePreviewUrl(link);
	if (!url) {
		return (
			<PoText variant="meta13" tone="textDanger">
				That isn't a Google Drive file link.
			</PoText>
		);
	}
	if (Platform.OS === "web") {
		return (
			<PillButton
				label="Open the video on Drive"
				variant="secondary"
				onPress={() =>
					Linking.openURL(url).catch((error: unknown) =>
						console.warn("[training] could not open the Drive video", error),
					)
				}
			/>
		);
	}
	return (
		<View style={[styles.frame, { height, backgroundColor: colors.bgSubtle }]}>
			<WebView
				source={{ uri: url }}
				allowsFullscreenVideo
				allowsInlineMediaPlayback
				mediaPlaybackRequiresUserAction={false}
				javaScriptEnabled
				style={styles.web}
				onError={(event) =>
					console.warn("[training] Drive video failed", event.nativeEvent.description)
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	frame: { width: "100%", borderRadius: 20, overflow: "hidden" },
	web: { flex: 1, backgroundColor: "transparent" },
});
