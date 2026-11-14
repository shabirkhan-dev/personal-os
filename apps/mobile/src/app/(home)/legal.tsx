import { useLocalSearchParams } from "expo-router";
import { LegalScreen } from "@/modules/profile/components/legal-screen";

/** Settings · Privacy policy (`?doc=privacy`) or Terms of use (`?doc=terms`). */
export default function LegalRoute() {
	const { doc } = useLocalSearchParams<{ doc?: string }>();
	return <LegalScreen doc={doc === "terms" ? "terms" : "privacy"} />;
}
