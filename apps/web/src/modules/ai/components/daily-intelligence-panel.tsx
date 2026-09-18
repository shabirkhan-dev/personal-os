"use client";

import { Alert, AlertDescription } from "@personal-os/ui/components/alert";
import { Button, buttonVariants } from "@personal-os/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@personal-os/ui/components/card";
import Link from "next/link";
import { useAuth } from "@/modules/auth/context/auth-context";
import { insightChatQuery } from "../ai.context";
import { aiErrorMessage } from "../ai.errors";
import { useDailyIntelligence } from "../use-ai-queries";

export function DailyIntelligencePanel() {
	const { user, token } = useAuth();
	const daily = useDailyIntelligence();
	if (!user || !token) return null;
	return (
		<section aria-labelledby="daily-intelligence-title" className="mb-6 flex flex-col gap-4">
			<header className="flex flex-wrap items-center justify-between gap-2">
				<h2 id="daily-intelligence-title" className="font-semibold text-lg">
					Daily Intelligence
				</h2>
				<Button
					variant="outline"
					size="sm"
					disabled={daily.isFetching}
					onClick={() => void daily.refetch()}
				>
					Refresh insights
				</Button>
			</header>
			<p className="text-muted-foreground text-sm">
				Read-only suggestions based on your routines and finance. No changes are made automatically.
			</p>
			{daily.isLoading && <p role="status">Preparing your daily insights…</p>}
			{daily.isError && (
				<Alert>
					<AlertDescription>
						{aiErrorMessage(daily.error)}
						{daily.data && <p>Showing the last successful insights; they may be out of date.</p>}
					</AlertDescription>
				</Alert>
			)}
			{daily.data && (
				<p className="text-muted-foreground text-sm">
					{daily.data.date} · {daily.data.timeZone}
				</p>
			)}
			{daily.data?.insights.length === 0 && (
				<p>No insights today. You can still ask a general question in Chat.</p>
			)}
			{daily.data?.insights.map((insight) => (
				<Card key={insight.id}>
					<CardHeader>
						<CardTitle>
							<h3>{insight.title}</h3>
						</CardTitle>
						<CardDescription>
							{insight.kind} · {insight.priority} priority
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 wrap-anywhere">
						<p>{insight.detail}</p>
						<details>
							<summary>Why this insight?</summary>
							{insight.sourceRefs.length ? (
								<ul>
									{insight.sourceRefs.map((source) => (
										<li key={`${source.type}:${source.id}`}>{source.label}</li>
									))}
								</ul>
							) : (
								<p>No source references were provided.</p>
							)}
						</details>
						{insight.suggestedAction && (
							<p>
								<strong>Suggestion: {insight.suggestedAction.title}</strong>{" "}
								{insight.suggestedAction.detail}
							</p>
						)}
					</CardContent>
					<CardFooter>
						<Link
							className={buttonVariants({ variant: "outline", size: "sm" })}
							href={{
								pathname: "/admin/ai",
								query: insightChatQuery(daily.data?.date ?? "", insight.sourceRefs[0]),
							}}
						>
							Discuss in Chat
						</Link>
					</CardFooter>
				</Card>
			))}
			<Link className="underline underline-offset-4" href="/admin/ai">
				Open Personal OS Chat
			</Link>
		</section>
	);
}
