import type { Config } from "@/config/env";
import { askJson } from "./ai.ask";
import {
	type AskFinanceInput,
	type FinanceAnswer,
	financeAnswer,
	type ReadSpendInput,
	type SpendReading,
	spendReading,
	type BudgetDraft,
	budgetDraft,
	budgetLines,
	type DesignBudgetInput,
} from "./finance.schema";

type Deps = { config: Config };

const READ =
	"Split a line about money spent into items, each with a short name, the amount in rupees " +
	"for that item and a category: food, bills, transport, care (skin, hair, body), giving " +
	"(charity, family), shopping or other. Quantities like '1 kg' go in the name, not the amount. " +
	"Set method to cash, bank or wallet when the line says how it was paid, otherwise null. " +
	"Never invent an amount: leave out an item that has none.";

export async function readSpend(deps: Deps, input: ReadSpendInput): Promise<SpendReading> {
	if (deps.config.ai.provider === "mock") return guessSpend(input.text);
	return askJson(deps.config, "Finance", "finance-read", READ, input.text, spendReading);
}

const GUIDANCE =
	"Answer a money question using the person's balance, runway in days, what a month costs, " +
	"fixed income, this month's spending against each budget line, upcoming bills and recent " +
	"entries. They avoid interest (riba) entirely: never suggest loans, credit cards or markup " +
	"instalments, and flag interest in any offer. Be specific with rupee amounts and days of " +
	"runway. Keep it under 90 words and offer up to three short follow-up questions. This is " +
	"general guidance, not financial advice.";

export async function askFinance(deps: Deps, input: AskFinanceInput): Promise<FinanceAnswer> {
	if (deps.config.ai.provider === "mock") {
		const runway =
			input.runwayDays === null ? "Income covers the month" : `${input.runwayDays} days of runway`;
		return {
			answer: `You asked “${input.question}”. ${runway}. With a provider key set, the answer appears here.`,
			followUps: ["Where can I cut this month?"],
		};
	}
	return askJson(
		deps.config,
		"Finance",
		"finance-ask",
		GUIDANCE,
		JSON.stringify(input),
		financeAnswer,
	);
}

/** The mock's reading: each comma or "and" part with a number becomes an item. */
export function guessSpend(source: string): SpendReading {
	const items = source
		.split(/,|\band\b|\+/i)
		.map((part) => part.trim())
		.filter(Boolean)
		.slice(0, 12)
		.flatMap((part) => {
			const amount = /(\d+(?:\.\d+)?)\s*$/.exec(part);
			if (!amount) return [];
			const name = part.slice(0, amount.index).trim();
			return name
				? [
						{
							name: name.charAt(0).toUpperCase() + name.slice(1, 60),
							amount: Number(amount[1]),
							category: "other" as const,
						},
					]
				: [];
		});
	const method = /\bcash\b/i.test(source) ? "cash" : /\bbank|card\b/i.test(source) ? "bank" : null;
	return { items, method };
}

const BUDGET =
	"Design a monthly budget in Pakistani rupees from the person's monthly cost, income, what " +
	"they spent per line on average and their notes. Give a limit for each line (food, bills, " +
	"transport, care, giving, shopping, dreams for savings goals, other); the limits should add up " +
	"to about the monthly cost, or less when they want to save. List the minimum that must be paid " +
	"whatever happens (rent, food, bills, transport) with amounts, and up to three short, concrete " +
	"tips. Keep giving at 2.5% or more when income allows. Plain words, no financial advice.";

/** Drafts budget limits and the minimum list; the person reviews them before anything is saved. */
export async function designBudget(deps: Deps, input: DesignBudgetInput): Promise<BudgetDraft> {
	if (deps.config.ai.provider === "mock") {
		const share: Record<(typeof budgetLines)[number], number> = {
			food: 0.3,
			bills: 0.25,
			transport: 0.1,
			care: 0.05,
			giving: 0.05,
			shopping: 0.08,
			dreams: 0.1,
			other: 0.07,
		};
		const limits = Object.fromEntries(
			budgetLines.map((name) => [name, Math.round((input.monthlyCost * share[name]) / 100) * 100]),
		);
		return {
			limits,
			minimum: [
				{ label: "Food", amount: limits.food ?? 0 },
				{ label: "Bills", amount: limits.bills ?? 0 },
			],
			tips: ["Pay the minimum first each month, then the rest."],
			note: "A balanced split of your month. With a provider key set, it is designed here.",
		};
	}
	return askJson(
		deps.config,
		"Finance",
		"design-budget",
		BUDGET,
		JSON.stringify(input),
		budgetDraft,
	);
}
