import { StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

/** Round initials avatar; the Figma frames use a photo the user has not added yet. */
export function Avatar({ name, size }: { name: string; size: number }) {
	const { colors } = usePoTheme();

	return (
		<View
			accessibilityLabel={name || "You"}
			style={[
				styles.avatar,
				{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSubtle },
			]}
		>
			<PoText variant={size < 40 ? "text14Medium" : "title18"} tone="textLink">
				{initials(name)}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	avatar: { alignItems: "center", justifyContent: "center" },
});
