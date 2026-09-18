export type InsightKind = "routine" | "finance" | "general";
export type InsightPriority = "low" | "medium" | "high";

export type SourceRef = {
	type: string;
	id: string;
	label: string;
};

export type SuggestedAction = {
	title: string;
	detail?: string;
	kind: "navigation" | "informational";
};

export type Insight = {
	id: string;
	kind: InsightKind;
	priority: InsightPriority;
	title: string;
	detail: string;
	sourceRefs: SourceRef[];
	suggestedAction?: SuggestedAction;
};

export type DailyIntelligence = {
	date: string;
	timeZone: string;
	insights: Insight[];
	provider?: string;
	model?: string;
};

export type ChatContextEntity = {
	type: "routine" | "routine_item" | "finance_transaction" | "budget";
	id: string;
};

export type ChatContext = {
	route?: string;
	entity?: ChatContextEntity;
	date?: string;
};

export type ChatSession = {
	id: string;
	title: string | null;
	context: {
		route: string | null;
		entity: { type: string; id: string } | null;
		date: string | null;
	};
	createdAt: string;
	updatedAt: string;
};

export type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
	sources: SourceRef[] | null;
	suggestions: SuggestedAction[] | null;
	provider: string | null;
	model: string | null;
	latencyMs: number | null;
	createdAt: string;
};

export type ChatSessionList = {
	sessions: ChatSession[];
};

export type ChatMessageList = {
	messages: ChatMessage[];
};

export type SendMessageInput = {
	message: string;
	context?: ChatContext;
};

export type CreateChatSessionInput = {
	title?: string;
	context?: ChatContext;
};
