import { describe, expect, it } from "vitest";

import { AppError } from "@/core/app-error";
import { assertPublicUrl, fetchPageText, htmlToText } from "@/modules/ai/web-page";

const page = (body: string, init: ResponseInit = {}) => new Response(body, init);
const longText = "Senior TypeScript Engineer at Tessera. ".repeat(10);
const redirectToLocal = async (url: string | URL | Request) =>
	String(url).includes("short")
		? page("", { status: 302, headers: { location: "http://127.0.0.1/admin" } })
		: page(`<p>${longText}</p>`);
const jobPage = async () => page(`<main><p>${longText}</p></main>`);
const signInWall = async () => page("<p>Please sign in</p>");

describe("htmlToText", () => {
	it("keeps visible text and drops scripts, styles and tags", () => {
		const html =
			"<html><head><title>x</title><style>p{}</style></head><body><h1>Role</h1>" +
			"<script>alert(1)</script><p>Pay &amp; perks&nbsp;&#8212; remote</p></body></html>";
		expect(htmlToText(html)).toBe("Role\nPay & perks — remote");
	});
});

describe("assertPublicUrl", () => {
	it.each([
		"http://localhost:3000/job",
		"http://127.0.0.1/",
		"http://2130706433/",
		"http://10.0.0.5/",
		"http://192.168.1.1/",
		"http://169.254.169.254/latest/meta-data",
		"http://[::1]/",
		"http://intranet/",
		"http://printer.local/",
		"file:///etc/passwd",
	])("refuses %s", (url) => {
		expect(() => assertPublicUrl(url)).toThrow(AppError);
	});

	it("allows public sites", () => {
		expect(() => assertPublicUrl("https://jobs.example.com/123")).not.toThrow();
	});
});

describe("fetchPageText", () => {
	it("follows redirects and checks every hop", async () => {
		await expect(
			fetchPageText("https://short.example.com/j", redirectToLocal as typeof fetch),
		).rejects.toMatchObject({ code: "JOB_LINK_UNREADABLE" });
	});

	it("reads a public page and refuses sign-in walls", async () => {
		expect(await fetchPageText("https://jobs.example.com/1", jobPage as typeof fetch)).toContain(
			"Tessera",
		);
		await expect(
			fetchPageText("https://jobs.example.com/2", signInWall as typeof fetch),
		).rejects.toMatchObject({
			message: "The page needs a sign-in or blocks reading.",
		});
	});
});
