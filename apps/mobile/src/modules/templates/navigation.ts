import { router } from "expo-router";
import type { TemplateModule } from "./lib/template-pack";

/** The template marketplace, from anywhere: all packs, or one module's. */
export const templateRoutes = {
	browse: (module?: TemplateModule) =>
		router.push({ pathname: "/templates", params: module ? { module } : {} }),
	pack: (id: string) => router.push({ pathname: "/templates/[id]", params: { id } }),
} as const;
