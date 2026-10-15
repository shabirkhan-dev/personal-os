import { create } from "zustand";

/**
 * Long AI work (a six-week skill path, interview prep) runs here instead of inside a screen, so
 * the person can leave the screen and keep using the app. The job saves its own result into the
 * record store when it finishes, and every screen that reads that data updates on its own.
 *
 * Jobs live for this app session only: a job cut off by closing the app is simply not done.
 */

export type AiJob = {
	key: string;
	/** What is being made, for the working card: "Your System design path". */
	label: string;
	status: "running" | "failed";
	startedAt: number;
	error?: string;
};

type Runner = () => Promise<void>;

type AiJobsState = {
	jobs: Record<string, AiJob>;
	/** Starts a job unless one with the same key is already running. */
	start: (key: string, label: string, run: Runner) => void;
	/** Runs a failed job again with the same work. */
	retry: (key: string) => void;
	dismiss: (key: string) => void;
};

const runners = new Map<string, { label: string; run: Runner }>();

const errorMessage = (error: unknown) =>
	error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";

export const useAiJobs = create<AiJobsState>((set, get) => {
	const launch = (key: string, label: string, run: Runner) => {
		runners.set(key, { label, run });
		set((state) => ({
			jobs: { ...state.jobs, [key]: { key, label, status: "running", startedAt: Date.now() } },
		}));
		run()
			.then(() => {
				runners.delete(key);
				set((state) => {
					const { [key]: _done, ...rest } = state.jobs;
					return { jobs: rest };
				});
			})
			.catch((error: unknown) => {
				console.warn(`[ai-jobs] ${key} failed`, error);
				set((state) => {
					const job = state.jobs[key];
					return job
						? {
								jobs: {
									...state.jobs,
									[key]: { ...job, status: "failed", error: errorMessage(error) },
								},
							}
						: state;
				});
			});
	};

	return {
		jobs: {},
		start: (key, label, run) => {
			if (get().jobs[key]?.status === "running") return;
			launch(key, label, run);
		},
		retry: (key) => {
			const runner = runners.get(key);
			if (runner && get().jobs[key]?.status === "failed") launch(key, runner.label, runner.run);
		},
		dismiss: (key) => {
			runners.delete(key);
			set((state) => {
				const { [key]: _gone, ...rest } = state.jobs;
				return { jobs: rest };
			});
		},
	};
});

/** The job with this key, if one is running or failed. */
export function useAiJob(key: string): AiJob | undefined {
	return useAiJobs((state) => state.jobs[key]);
}
