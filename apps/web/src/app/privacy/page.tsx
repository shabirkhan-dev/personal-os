import { PRIVACY_POLICY } from "@personal-os/domain/legal";
import type { Metadata } from "next";
import { LegalPage } from "@/modules/legal/legal-page";

export const metadata: Metadata = {
	title: "Privacy policy · Personal OS",
	description: "What Personal OS stores, where it goes and what you control.",
};

export default function PrivacyPage() {
	return <LegalPage document={PRIVACY_POLICY} />;
}
