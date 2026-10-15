import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { useAuth } from "@/modules/auth";
import { useAvatarStore } from "@/modules/profile/store/avatar-store";
import { usePoTheme } from "@/theme";

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

/** The person's photo (on this phone first, then the account's), or round initials. */
export function Avatar({ name, size }: { name: string; size: number }) {
	const { colors } = usePoTheme();
	const local = useAvatarStore((state) => state.data.uri);
	const hydrated = useAvatarStore((state) => state.hydrated);
	const hydrate = useAvatarStore((state) => state.hydrate);
	const { user } = useAuth();
	const photo = local ?? user?.avatarUrl ?? null;

	useEffect(() => {
		if (!hydrated) void hydrate();
	}, [hydrated, hydrate]);

	const box = { width: size, height: size, borderRadius: size / 2 };
	if (photo) {
		return (
			<Image
				source={{ uri: photo }}
				accessibilityLabel={name || "You"}
				style={[box, { backgroundColor: colors.accentSubtle }]}
			/>
		);
	}
	return (
		<View
			accessibilityLabel={name || "You"}
			style={[styles.avatar, box, { backgroundColor: colors.accentSubtle }]}
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
