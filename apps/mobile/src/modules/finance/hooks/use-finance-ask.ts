import { useAiJobs } from "@/lib/ai-jobs/ai-jobs-store";
import { dayKey } from "@/lib/day";
import { voiceOut } from "@/lib/voice";
import { CATEGORIES, CATEGORY_LABELS } from "../lib/finance-model";
import { dayLabel, rupees, upcomingBills } from "../lib/finance-math";
import { financeAiMessage, useFinanceAi } from "../services/finance-ai";
import { FINANCE_ASK_JOB, useFinanceUi } from "./finance-ui-store";
import { useFinanceToday } from "./use-finance";

/** Asks the Finance AI about the person's money; without AI it answers with the runway. */
export function useFinanceAsk(onOffline: (text: string) => void) {
	const { data, now, balance, days, spent, budget, sums, limits } = useFinanceToday();
	const ai = useFinanceAi();
	const startJob = useAiJobs((state) => state.start);

	return (question: string, spoken: boolean) => {
		if (!ai.available) {
			const text =
				days === null
					? `${rupees(balance)} now, and income covers the month. ${rupees(budget - spent)} left in the budget.`
					: `${rupees(balance)} lasts about ${days} days. ${rupees(budget - spent)} left in this month's budget.`;
			onOffline(text);
			if (spoken) voiceOut.speak(text);
			return;
		}
		useFinanceUi.getState().setAnswer(null);
		startJob(FINANCE_ASK_JOB, "Thinking about your money", async () => {
			try {
				const answer = await ai.ask(question, {
					balance,
					runwayDays: days,
					monthlyCost: data.settings.monthlyCost,
					monthlyIncome: data.settings.monthlyIncome,
					spent,
					budget,
					lines: CATEGORIES.filter((category) => limits[category] > 0).map((category) => ({
						name: CATEGORY_LABELS[category],
						spent: sums[category],
						limit: limits[category],
					})),
					bills: upcomingBills(data.bills, now).map((item) => ({
						name: item.bill.name,
						amount: item.bill.amount,
						due: dayLabel(item.due),
					})),
					recent: data.entries.slice(0, 12).map((entry) => ({
						day: dayKey(new Date(entry.at)),
						title: entry.title,
						amount: entry.amount,
						kind: entry.kind,
					})),
				});
				useFinanceUi.getState().setAnswer({ ...answer, question });
				if (spoken) voiceOut.speak(answer.answer);
			} catch (error) {
				throw new Error(financeAiMessage(error), { cause: error });
			}
		});
	};
}
