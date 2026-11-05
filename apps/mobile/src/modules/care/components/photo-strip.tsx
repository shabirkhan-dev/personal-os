import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { FilterChip } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { PHOTO_MESSAGES, pickPhoto } from "@/lib/photos/pick-photo";
import { usePoTheme } from "@/theme";
import { ProductImage } from "./product-image";

/** Up to `max` photos in a row, each removable, with Take photo and Choose to add one. */
export function PhotoStrip({
	photos,
	onChange,
	max = 4,
	size = 84,
}: {
	photos: readonly string[];
	onChange: (photos: string[]) => void;
	max?: number;
	size?: number;
}) {
	const { colors } = usePoTheme();
	const [message, setMessage] = useState<string | null>(null);
	const add = async (source: "camera" | "library") => {
		setMessage(null);
		const result = await pickPhoto(source, "care-photos");
		if (result.status === "ok") onChange([...photos, result.uri].slice(0, max));
		else if (result.status === "denied" || result.status === "error")
			setMessage(PHOTO_MESSAGES[result.status]);
	};
	return (
		<View style={styles.root}>
			{photos.length > 0 ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.row}
				>
					{photos.map((uri, index) => (
						<View key={uri}>
							<ProductImage photo={uri} size={size} radius={16} />
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={`Remove photo ${index + 1}`}
								hitSlop={8}
								onPress={() => {
									haptics.tap();
									onChange(photos.filter((item) => item !== uri));
								}}
								style={[styles.remove, { backgroundColor: colors.bgInverse }]}
							>
								<Icon name="Line/Close" size={12} color={colors.textInverse} />
							</Pressable>
						</View>
					))}
				</ScrollView>
			) : null}
			{photos.length < max ? (
				<View style={styles.buttons}>
					<FilterChip label="Take photo" selected={false} onPress={() => void add("camera")} />
					<FilterChip label="Choose" selected={false} onPress={() => void add("library")} />
					<PoText variant="meta13" tone="textTertiary">
						{photos.length ? `${photos.length} of ${max}` : `Up to ${max}`}
					</PoText>
				</View>
			) : null}
			{message ? (
				<PoText variant="meta13" tone="textDanger">
					{message}
				</PoText>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { gap: 8 },
	row: { gap: 8 },
	remove: {
		position: "absolute",
		top: 4,
		right: 4,
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
	},
	buttons: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
});
