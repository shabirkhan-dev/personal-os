import { LEGAL_DOCUMENTS } from "@personal-os/domain/legal";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ScreenTitle } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

/** Settings · Privacy policy or Terms of use, the same text as on the website. */
export function LegalScreen({ doc }: { doc: "privacy" | "terms" }) {
	const { colors } = usePoTheme();
	const document = LEGAL_DOCUMENTS[doc];
	return (
		<ModuleScreen label="Legal" tab="profile" onHome={() => router.dismissTo("/")}>
			<ScreenTitle eyebrow={`Updated ${document.updated}`} title={document.title} />
			<PoText variant="row15" tone="textSecondary" style={styles.pad}>
				{document.intro}
			</PoText>
			{document.sections.map((section) => (
				<View key={section.heading} style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<PoText variant="title18" accessibilityRole="header">
						{section.heading}
					</PoText>
					{section.paragraphs.map((paragraph) => (
						<PoText key={paragraph.slice(0, 40)} variant="meta13" tone="textSecondary">
							{paragraph}
						</PoText>
					))}
				</View>
			))}
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	pad: { paddingHorizontal: 8 },
	card: { gap: 10, padding: 16, borderRadius: 20 },
});
