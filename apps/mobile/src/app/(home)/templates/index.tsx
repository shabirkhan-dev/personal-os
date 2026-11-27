import { useLocalSearchParams } from "expo-router";
import { MODULE_LABELS, type TemplateModule } from "@/modules/templates/lib/template-pack";
import { TemplatesScreen } from "@/modules/templates/components/templates-screen";

/** Templates: the marketplace of packs (`?module=food` opens one module's). */
export default function TemplatesRoute() {
	const { module } = useLocalSearchParams<{ module?: string }>();
	const known = module && module in MODULE_LABELS ? (module as TemplateModule) : null;
	return <TemplatesScreen module={known} />;
}
