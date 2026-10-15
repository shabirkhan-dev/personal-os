import { beforeEach, describe, expect, it } from "bun:test";
import { useAiJobs } from "./ai-jobs-store";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferred() {
	let resolve!: () => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

beforeEach(() => {
	for (const key of Object.keys(useAiJobs.getState().jobs)) useAiJobs.getState().dismiss(key);
});

describe("ai jobs", () => {
	it("runs a job, then removes it when it succeeds", async () => {
		const work = deferred();
		useAiJobs.getState().start("skill-path", "Your path", () => work.promise);
		expect(useAiJobs.getState().jobs["skill-path"]?.status).toBe("running");
		work.resolve();
		await tick();
		expect(useAiJobs.getState().jobs["skill-path"]).toBeUndefined();
	});

	it("ignores a second start while one is running", async () => {
		let runs = 0;
		const work = deferred();
		const run = () => {
			runs += 1;
			return work.promise;
		};
		useAiJobs.getState().start("prep:a", "Prep", run);
		useAiJobs.getState().start("prep:a", "Prep", run);
		expect(runs).toBe(1);
		work.resolve();
		await tick();
	});

	it("keeps a failed job with its message, and retries the same work", async () => {
		let attempt = 0;
		const run = async () => {
			attempt += 1;
			if (attempt === 1) throw new Error("AI took too long to answer. Try again.");
		};
		useAiJobs.getState().start("prep:b", "Prep", run);
		await tick();
		expect(useAiJobs.getState().jobs["prep:b"]).toMatchObject({
			status: "failed",
			error: "AI took too long to answer. Try again.",
		});
		useAiJobs.getState().retry("prep:b");
		await tick();
		expect(attempt).toBe(2);
		expect(useAiJobs.getState().jobs["prep:b"]).toBeUndefined();
	});
});
