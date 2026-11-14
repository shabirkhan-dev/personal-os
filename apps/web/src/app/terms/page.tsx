import { TERMS } from "@personal-os/domain/legal";
import type { Metadata } from "next";
import { LegalPage } from "@/modules/legal/legal-page";

export const metadata: Metadata = {
	title: "Terms of use · Personal OS",
	description: "The terms for using the Personal OS app and its online services.",
};

export default function TermsPage() {
	return <LegalPage document={TERMS} />;
}
