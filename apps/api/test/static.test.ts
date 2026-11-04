import { describe, expect, it } from "vitest";

import { createApp } from "@/app";
import { memoryBucket, testEnv } from "./support";

const bucket = memoryBucket();
bucket.put("static/training/push-up.webp", 12, "image/webp");
const app = createApp({ openDatabase: () => ({ db: {} as never, close: async () => undefined }) });
const get = (path: string, env = testEnv({ ASSETS: bucket })) =>
	app.request(`/api/v1/static/${path}`, {}, env);

describe("built-in photos from R2", () => {
	it("serves a photo without sign-in, cached for a year", async () => {
		const response = await get("training/push-up.webp");
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/webp");
		expect(response.headers.get("cache-control")).toContain("immutable");
		expect((await response.arrayBuffer()).byteLength).toBe(12);
	});

	it("only serves image paths under static/, never other objects", async () => {
		expect((await get("training/missing.webp")).status).toBe(404);
		expect((await get("..%2Favatars%2Fu%2Fx.png")).status).toBe(404);
		expect((await get("avatars.png")).status).toBe(404);
		expect((await get("training/notes.txt")).status).toBe(404);
	});

	it("says so when the bucket isn't bound", async () => {
		expect((await get("training/push-up.webp", testEnv())).status).toBe(503);
	});
});
