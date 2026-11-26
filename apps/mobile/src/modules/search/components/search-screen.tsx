import { textStyles } from "@personal-os/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { toTextStyle, usePoTheme } from "@/theme";
import { useSearchEntries } from "../hooks/use-search-entries";
import { searchEntries } from "../lib/search-index";

const inputStyle = toTextStyle(textStyles.body15);

/** One search across everything saved on the phone: recipes, money, medicines, jobs, screens… */
export function SearchScreen() {
	const { colors } = usePoTheme();
	const [query, setQuery] = useState("");
	const entries = useSearchEntries();
	const results = searchEntries(entries, query);
	const typed = query.trim().length > 0;

	return (
		<ModuleScreen label="Search" tab="today" onHome={() => router.dismissTo("/")}>
			<View style={[styles.search, { backgroundColor: colors.bgSubtle }]}>
				<Icon name="Search" size={16} color={colors.textSecondary} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search your recipes, money, medicines…"
					placeholderTextColor={colors.textTertiary}
					accessibilityLabel="Search everything"
					returnKeyType="search"
					style={[inputStyle, styles.flex, { color: colors.textPrimary }]}
				/>
				{typed ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Clear the search"
						hitSlop={10}
						onPress={() => setQuery("")}
					>
						<Icon name="Line/Close" size={16} color={colors.textSecondary} />
					</Pressable>
				) : null}
			</View>

			{!typed ? (
				<PoText variant="body15" tone="textSecondary" style={styles.pad}>
					Everything you saved is searchable here, along with screens like Budget, Backup or Tasbih.
					It all stays on this phone.
				</PoText>
			) : results.length === 0 ? (
				<PoText variant="body15" tone="textSecondary" style={styles.pad}>
					{`Nothing matches "${query.trim()}".`}
				</PoText>
			) : (
				<View style={[styles.list, { backgroundColor: colors.bgSurface }]}>
					{results.map((item, index) => (
						<Pressable
							key={item.id}
							accessibilityRole="button"
							accessibilityLabel={`${item.title}, ${item.module}`}
							onPress={() => router.push(item.href as Parameters<typeof router.push>[0])}
							style={({ pressed }) => [
								styles.row,
								index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderDefault } : null,
								pressed ? { backgroundColor: colors.bgHover } : null,
							]}
						>
							<View style={styles.flex}>
								<PoText variant="eyebrow11" tone="textTertiary">
									{item.module.toUpperCase()}
								</PoText>
								<PoText variant="row15" numberOfLines={1}>
									{item.title}
								</PoText>
								{item.subtitle ? (
									<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
										{item.subtitle}
									</PoText>
								) : null}
							</View>
							<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
						</Pressable>
					))}
				</View>
			)}
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, minWidth: 0, gap: 2 },
	pad: { paddingHorizontal: 8 },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 48,
		paddingHorizontal: 16,
		borderRadius: 24,
	},
	list: { paddingHorizontal: 16, borderRadius: 22 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
});
