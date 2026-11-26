import { parseTemplateFile } from "@personal-os/domain/templates";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app";
import { testEnv } from "./support";

const app = createApp({ openDatabase: () => ({ db: {} as never, close: async () => undefined }) });

describe("template packs from the server", () => {
	it("lists valid template files anyone can read, cached for an hour", async () => {
		const response = await app.request("/api/v1/templates", {}, testEnv());
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
		const body = (await response.json()) as { data: { packs: unknown[] } };
		expect(body.data.packs.length).toBeGreaterThanOrEqual(6);
		const ids = new Set<string>();
		for (const pack of body.data.packs) {
			const parsed = parseTemplateFile(pack);
			expect(parsed.ok).toBe(true);
			if (parsed.ok) ids.add(parsed.file.id);
		}
		expect(ids.size).toBe(body.data.packs.length);
	});
});
