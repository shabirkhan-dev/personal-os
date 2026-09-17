export type InsightKind = "routine" | "finance" | "general";
export type InsightPriority = "low" | "medium" | "high";

export interface SourceRef {
	type: string;
	id: string;
	label: string;
}

export interface SuggestedAction {
	title: string;
	detail?: string;
	kind: "navigation" | "informational";
}

export interface Insight {
	id: string;
	kind: InsightKind;
	priority: InsightPriority;
	title: string;
	detail: string;
	sourceRefs: SourceRef[];
	suggestedAction?: SuggestedAction;
}

export interface DailyIntelligence {
	date: string;
	timeZone: string;
	insights: Insight[];
	provider?: string;
	model?: string;
}

export interface ContextEntity {
	type: "routine" | "routine_item" | "finance_transaction" | "budget";
	id: string;
}

export interface ChatContext {
	route?: string;
	entity?: ContextEntity;
	date?: string;
}

export interface ChatSession {
	id: string;
	title: string | null;
	context: {
		route: string | null;
		entity: ContextEntity | null;
		date: string | null;
	};
	createdAt: string;
	updatedAt: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	sources: SourceRef[] | null;
	suggestions: SuggestedAction[] | null;
	provider: string | null;
	model: string | null;
	latencyMs: number | null;
	createdAt: string;
}

export interface CreateChatSessionInput {
	title?: string;
	context?: ChatContext;
}

export interface SendMessageInput {
	message: string;
	context?: ChatContext;
}

export interface ListSessionsQuery {
	limit?: number;
	offset?: number;
}

export interface ChatSessionsResponse {
	sessions: ChatSession[];
}

export interface ChatMessagesResponse {
	messages: ChatMessage[];
}

export interface SendMessageResponse {
	message: ChatMessage;
}
