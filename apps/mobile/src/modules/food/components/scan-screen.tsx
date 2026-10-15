import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { EmptyCard, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { useFoodUi } from "../hooks/food-ui-store";
import { lookupBarcode } from "../services/barcode-lookup";
import { FoodScreen } from "./food-screen";

const MESSAGES = {
	unknown: "That packet isn't in the open food database yet. Type it on the log screen instead.",
	offline: "Couldn't look it up. Check your connection and scan again.",
	invalid: "That isn't a food barcode. Try the one on the back of the packet.",
} as const;

/** Barcode: point the camera at a packet; the label's numbers go to the Log meal screen. */
export function ScanScreen() {
	const { colors } = usePoTheme();
	const [permission, requestPermission] = useCameraPermissions();
	const [status, setStatus] = useState<string | null>(null);
	const busy = useRef(false);

	const onCode = (code: string) => {
		if (busy.current) return;
		busy.current = true;
		haptics.tap();
		setStatus("Looking it up…");
		void lookupBarcode(code).then((result) => {
			if (result.status === "ok") {
				haptics.success();
				useFoodUi.getState().setDraft({
					text: result.item.name,
					items: [result.item],
					unmatched: [],
					slot: null,
					photo: null,
					source: "barcode",
				});
				router.replace("/food/log");
				return;
			}
			setStatus(MESSAGES[result.status]);
			setTimeout(() => {
				busy.current = false;
			}, 1500);
		});
	};

	return (
		<FoodScreen>
			<ScreenTitle eyebrow="Barcode" title="Scan a packet" />
			{!permission ? null : permission.granted ? (
				<View style={[styles.frame, { borderColor: colors.borderDefault }]}>
					<CameraView
						style={styles.camera}
						facing="back"
						barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
						onBarcodeScanned={(result) => onCode(result.data)}
					/>
					<View
						pointerEvents="none"
						style={[styles.target, { borderColor: colors.accentDefault }]}
					/>
				</View>
			) : (
				<EmptyCard
					icon="Filled/Scan"
					title="Camera needed"
					body="Barcodes are read on the phone; only the number is looked up in Open Food Facts."
				>
					<PillButton
						label={permission.canAskAgain ? "Allow camera" : "Open Settings to allow"}
						onPress={() =>
							void (permission.canAskAgain ? requestPermission() : Linking.openSettings())
						}
					/>
				</EmptyCard>
			)}
			<PoText variant="meta13" tone="textSecondary" style={styles.note}>
				{status ??
					"Hold the barcode inside the frame. Numbers are per serving when the label gives one."}
			</PoText>
		</FoodScreen>
	);
}

const styles = StyleSheet.create({
	frame: { height: 360, borderRadius: 28, borderWidth: 1, overflow: "hidden" },
	camera: { flex: 1 },
	target: {
		position: "absolute",
		left: "12%",
		right: "12%",
		top: "34%",
		height: "32%",
		borderWidth: 2,
		borderRadius: 18,
	},
	note: { paddingHorizontal: 6 },
});
