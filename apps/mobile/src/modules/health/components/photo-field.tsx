import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { healthPhoto } from "../services/health-photo";
import { SmallButton } from "./health-cards";
import { PhotoThumb } from "./health-widgets";

export { PhotoThumb } from "./health-widgets";

const MESSAGES = {
	denied: "Health needs camera or photo access for this. You can allow it in Settings.",
	error: "Couldn't get that photo. Try again.",
} as const;

/** The photo row in a sheet: what's there, and buttons to take, pick or remove one. */
export function PhotoField({
	value,
	onChange,
	shape,
	icon,
}: {
	value: string | null;
	onChange: (uri: string | null) => void;
	shape: "square" | "paper";
	icon: IconName;
}) {
	const [message, setMessage] = useState<string | null>(null);
	const pick = async (source: "camera" | "library") => {
		setMessage(null);
		const result = await healthPhoto(source, shape);
		if (result.status === "ok") onChange(result.uri);
		else if (result.status === "denied" || result.status === "error")
			setMessage(MESSAGES[result.status]);
	};
	return (
		<View style={styles.field}>
			<View style={styles.row}>
				<PhotoThumb uri={value} size={72} icon={icon} tall={shape === "paper"} />
				<View style={styles.buttons}>
					<SmallButton label="Take photo" onPress={() => void pick("camera")} />
					<SmallButton label="Choose" onPress={() => void pick("library")} />
					{value ? <SmallButton label="Remove" onPress={() => onChange(null)} /> : null}
				</View>
			</View>
			{message ? (
				<PoText variant="meta13" tone="textDanger">
					{message}
				</PoText>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	field: { gap: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	buttons: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
