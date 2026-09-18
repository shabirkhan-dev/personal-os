"use client";

import { Alert, AlertDescription } from "@personal-os/ui/components/alert";
import { Button } from "@personal-os/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/modules/auth/context/auth-context";
import { ChatComposer } from "@/modules/chat/components/chat/chat-composer";
import { readChatContext } from "../ai.context";
import { aiErrorMessage } from "../ai.errors";
import { aiService } from "../ai.service";
import type { ChatMessageList } from "../ai.types";
import { useChatMessages, useChatSessions } from "../use-ai-queries";
import "@/modules/chat/styles/chat.css";

export function AiAssistScreen() {
	const { user, token, loading } = useAuth();
	if (loading) return <p role="status">Loading your session…</p>;
	if (!user || !token)
		return (
			<p>
				<Link href="/login">Sign in to use Personal OS AI</Link>
			</p>
		);
	return (
		<Suspense fallback={<p role="status">Loading chat…</p>}>
			<ChatWorkspace key={user.id} token={token} userId={user.id} />
		</Suspense>
	);
}

function ChatWorkspace({ token, userId }: { token: string; userId: string }) {
	const params = useSearchParams();
	const initialSession = params.get("session");
	const [sessionId, setSessionId] = useState<string | null>(initialSession);
	const [draft, setDraft] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const [failedSend, setFailedSend] = useState(false);
	const active = useRef(true);
	const sending = useRef(false);
	const queryClient = useQueryClient();
	const sessions = useChatSessions();
	const history = useChatMessages(sessionId);
	const messages = history.data?.messages ?? [];
	const incomingContext = readChatContext(params);
	const selectedSession = sessions.data?.pages
		.flatMap((page) => page.sessions)
		.find((session) => session.id === sessionId);
	const displayContext = sessionId ? selectedSession?.context : incomingContext;

	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);

	useEffect(() => {
		setSessionId(initialSession);
	}, [initialSession]);

	function selectSession(id: string | null) {
		setSessionId(id);
		setDraft("");
		setError(null);
		setFailedSend(false);
		const url = new URL(window.location.href);
		if (id) url.searchParams.set("session", id);
		else url.searchParams.delete("session");
		window.history.replaceState(null, "", url);
	}

	async function send(content: string) {
		const message = content.trim();
		if (!message || message.length > 4000 || sending.current) return;
		sending.current = true;
		setBusy(true);
		setError(null);
		setFailedSend(false);
		let id = sessionId;
		try {
			if (!id) {
				const session = await aiService.createSession(token, {
					title: message.slice(0, 120),
					context: incomingContext,
				});
				if (!active.current) return;
				id = session.id;
				selectSession(id);
			}
			await queryClient.cancelQueries({ queryKey: ["ai", userId, "messages", id] });
			const result = await aiService.sendMessage(token, id, { message });
			if (!active.current) return;
			await queryClient.cancelQueries({ queryKey: ["ai", userId, "messages", id] });
			if (!active.current) return;
			queryClient.setQueryData<ChatMessageList>(["ai", userId, "messages", id], {
				messages: [
					...messages,
					{
						id: crypto.randomUUID(),
						role: "user",
						content: message,
						sources: null,
						suggestions: null,
						provider: null,
						model: null,
						latencyMs: null,
						createdAt: new Date().toISOString(),
					},
					result.message,
				],
			});
			selectSession(id);
			await sessions.refetch();
		} catch (caught) {
			if (!active.current) return;
			setDraft(message);
			setError(caught);
			setFailedSend(Boolean(id));
			if (id) {
				await queryClient.invalidateQueries({ queryKey: ["ai", userId, "messages", id] });
			}
		} finally {
			sending.current = false;
			if (active.current) setBusy(false);
		}
	}

	return (
		<section
			aria-label="Personal OS Chat"
			className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 text-foreground sm:p-6"
		>
			<header>
				<h1 className="font-semibold text-xl">Personal OS Chat</h1>
				<p className="text-muted-foreground text-sm">
					Read-only guidance. Suggestions never change your data.
				</p>
			</header>
			<div className="flex flex-wrap gap-2 text-sm">
				{displayContext?.route && <span>Screen: {displayContext.route}</span>}
				{displayContext?.date && <span>Date: {displayContext.date}</span>}
				{displayContext?.entity && (
					<span>
						Entity: {displayContext.entity.type} · {displayContext.entity.id}
					</span>
				)}
				{!displayContext?.route && !displayContext?.date && !displayContext?.entity && (
					<span>General conversation</span>
				)}
			</div>
			<nav aria-label="Conversations" className="flex flex-wrap items-center gap-2">
				<Button variant="outline" disabled={busy} onClick={() => selectSession(null)}>
					New conversation
				</Button>
				{sessions.isLoading && <p role="status">Loading conversations…</p>}
				{sessions.isSuccess && sessions.data.pages.every((page) => page.sessions.length === 0) && (
					<p>No conversations yet. Send a message to begin.</p>
				)}
				{sessions.data?.pages
					.flatMap((page) => page.sessions)
					.map((session) => (
						<Button
							key={session.id}
							variant={session.id === sessionId ? "secondary" : "ghost"}
							disabled={busy}
							onClick={() => selectSession(session.id)}
							aria-pressed={session.id === sessionId}
						>
							<span className="max-w-48 truncate">{session.title || "Untitled conversation"}</span>
						</Button>
					))}
				{sessions.hasNextPage && (
					<Button
						disabled={sessions.isFetchingNextPage}
						onClick={() => void sessions.fetchNextPage()}
					>
						More conversations
					</Button>
				)}
			</nav>
			{sessions.isError && (
				<Alert>
					<AlertDescription>
						{aiErrorMessage(sessions.error)}
						<Button
							variant="outline"
							disabled={sessions.isFetching}
							onClick={() => void sessions.refetch()}
						>
							Retry conversations
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{sessionId && history.isLoading && <p role="status">Loading messages…</p>}
			{history.isError && (
				<Alert>
					<AlertDescription>
						{aiErrorMessage(history.error)}
						<Button
							variant="outline"
							disabled={history.isFetching}
							onClick={() => void history.refetch()}
						>
							Reload messages
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-col gap-4" role="log" aria-label="Messages" aria-live="polite">
				{messages.map((message) => (
					<article
						key={message.id}
						className="flex flex-col gap-2 rounded-lg border p-4 wrap-anywhere"
					>
						<h2 className="font-semibold">{message.role === "user" ? "You" : "Personal OS"}</h2>
						<p className="whitespace-pre-wrap">{message.content}</p>
						{Boolean(message.sources?.length) && (
							<details>
								<summary>Sources</summary>
								<ul>
									{message.sources?.map((source) => (
										<li key={`${source.type}:${source.id}`}>{source.label}</li>
									))}
								</ul>
							</details>
						)}
						{message.suggestions?.map((suggestion) => (
							<p key={suggestion.title}>
								<strong>Suggestion: {suggestion.title}</strong> {suggestion.detail}
							</p>
						))}
					</article>
				))}
				{sessionId && history.isSuccess && messages.length === 0 && (
					<p>This conversation has no messages yet.</p>
				)}
			</div>
			{busy && <p role="status">Waiting for the assistant…</p>}
			{error !== null && (
				<Alert>
					<AlertDescription>
						{aiErrorMessage(error)}
						{failedSend && (
							<p>
								Your message may already be saved. Reload messages before resending to avoid
								duplicates.
							</p>
						)}
					</AlertDescription>
				</Alert>
			)}
			{messages.length >= 200 && <p>This conversation is full. Start a new conversation.</p>}
			<div className="chat-design-system">
				<ChatComposer
					value={draft}
					onChange={setDraft}
					onSubmitPrompt={(value) => void send(value)}
					busy={busy}
					disabled={
						history.isError ||
						Boolean(sessionId && history.isLoading) ||
						messages.length >= 200 ||
						draft.length > 4000
					}
					modelLabel="Personal OS"
					showUpgradeRail={false}
				/>
			</div>
			<p className="text-muted-foreground text-sm">{draft.length}/4000 characters</p>
		</section>
	);
}
