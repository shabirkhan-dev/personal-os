export interface UpstreamSourceRef {
	type: string;
	id: string;
	label: string;
}

export interface UpstreamSuggestedAction {
	title: string;
	detail?: string;
	/** v0 suggestions are informational only and never executed by the backend. */
	kind: 'navigation' | 'informational';
}

export interface DailyIntelligenceUpstreamRequest {
	date: string;
	timeZone: string;
	context: {
		routines: unknown;
		financeMonth: string;
		financeSummary: unknown;
	};
}

export interface InsightPayload {
	id: string;
	kind: 'routine' | 'finance' | 'general';
	priority: 'low' | 'medium' | 'high';
	title: string;
	detail: string;
	sourceRefs: UpstreamSourceRef[];
	suggestedAction?: UpstreamSuggestedAction;
}

export interface DailyIntelligenceUpstreamResponse {
	insights: InsightPayload[];
	provider?: string;
	model?: string;
}

export interface ChatUpstreamMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatUpstreamRequest {
	messages: ChatUpstreamMessage[];
	context?: {
		route?: string;
		entity?: { type: string; id: string };
		date?: string;
		personalOS?: unknown;
	};
}

export interface ChatUpstreamResponse {
	reply: string;
	provider?: string;
	model?: string;
	sources?: UpstreamSourceRef[];
	suggestions?: UpstreamSuggestedAction[];
}
