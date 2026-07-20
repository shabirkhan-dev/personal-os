import {
	ApertureIcon,
	CircleIcon,
	CommandIcon,
	GemIcon,
	HexagonIcon,
	OctagonIcon,
	Package01Icon,
	SecurityCheckIcon,
	TriangleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const SITE = {
	name: "Personal OS",
	title: "Personal OS — your life operating system",
	description: "Personal life operating system — track routines, finance, skincare, food, fashion, and daily habits in one web and mobile app.",
} as const;

export const LANDING_COPY = {
	heroBadge: "Built for your daily life",
	heroTitlePrimary: "Run your life from one place",
	heroTitleSecondary: "not ten scattered apps",
	heroSubtitle:
		"Finance, skincare routines, meals, fashion, habits, and personal care — Personal OS is your control plane for everyday life.",
	workflowCardTitle: "Morning routine",
	workflowCardSub: "personal-os",
	chatCardTitle: "Life assistant",
	chatCardSub: "Personal OS · ready",
	productHeading: "From morning routine to monthly budget — one connected system.",
	productBody:
		"Personal OS connects the domains you actually live in: daily habits, personal care, food, fashion, and finance — web and mobile, with AI assist when you need it.",
	whyLabel: "Why Personal OS",
	whyHeading: "Built for people who want one home for their life.",
	whySub: "Not another generic todo app — a personal operating system shaped around how you live.",
	aboutTitle: "About Personal OS",
	aboutLead:
		"Personal OS is the place for your routines, money, care, food, and style — one dashboard, one mobile companion, one source of truth for you.",
} as const;

export type NavLink = {
	label: string;
	href: string;
};

export type NavSubItem = {
	label: string;
	description: string;
	href: string;
};

export type NavItem = {
	label: string;
	href: string;
	items?: NavSubItem[];
};

export const NAV_ITEMS: NavItem[] = [
	{
		label: "Product",
		href: "#product",
		items: [
			{
				label: "Apps",
				description: "Web, mobile, Nest API, docs, and Rust",
				href: "/#product",
			},
			{
				label: "Architecture",
				description: "Workspace packages and import boundaries",
				href: "/#why",
			},
			{
				label: "Capabilities",
				description: "Shared UI, CI, Docker, and polyglot tooling",
				href: "/#capabilities",
			},
		],
	},
	{
		label: "Resources",
		href: "#customers",
		items: [
			{
				label: "Docs",
				description: "Quick start and deep references",
				href: "http://localhost:3002/docs",
			},
			{
				label: "Stack",
				description: "What ships in the monorepo",
				href: "/#customers",
			},
			{
				label: "About",
				description: "Why we built Starter",
				href: "/about",
			},
		],
	},
	{ label: "Pricing", href: "/pricing" },
	{ label: "About", href: "/about" },
];

export type HeroAvatar = {
	seed: string;
	alt: string;
};

export const HERO_AVATARS: HeroAvatar[] = [
	{ seed: "Aria", alt: "Aria" },
	{ seed: "Milo", alt: "Milo" },
	{ seed: "Juno", alt: "Juno" },
	{ seed: "Remy", alt: "Remy" },
];

export type WorkflowStep = {
	id: string;
	label: string;
	detail: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
	{
		id: "anomaly",
		label: "Clone the repo",
		detail: "git clone â†’ bun install",
	},
	{
		id: "investigating",
		label: "Hooks installed",
		detail: "lefthook prepare formats and guards commits",
	},
	{
		id: "root",
		label: "Workspace ready",
		detail: "Turbo graph links web, mobile, Nest, docs, Rust",
	},
	{
		id: "fix",
		label: "Dev servers up",
		detail: "bun run dev â€” apps online in minutes",
	},
	{
		id: "notify",
		label: "Quality gates green",
		detail: "lint Â· typecheck Â· architecture check pass",
	},
];

export type ChatMessage = {
	role: "user" | "agent";
	text: string;
};

export const AGENT_MESSAGES: ChatMessage[] = [
	{
		role: "user",
		text: "Can Personal OS track my skincare routine and spending in one place?",
	},
	{
		role: "agent",
		text: "Yes — routines, finance, food, and fashion modules share one profile and timeline.",
	},
	{
		role: "agent",
		text: "Log a skincare step on mobile; see spend vs. budget on web the same day.",
	},
	{
		role: "agent",
		text: "AI assist helps plan meals, outfits, and habits without leaving your OS.",
	},
];

export type CustomerLogo = {
	name: string;
	icon: IconSvgElement;
};

export const CUSTOMER_LOGOS: CustomerLogo[] = [
	{ name: "Next.js", icon: HexagonIcon },
	{ name: "Expo", icon: TriangleIcon },
	{ name: "NestJS", icon: ApertureIcon },
	{ name: "Turbo", icon: Package01Icon },
	{ name: "Bun", icon: GemIcon },
	{ name: "Biome", icon: CommandIcon },
	{ name: "Docker", icon: OctagonIcon },
	{ name: "Rust", icon: CircleIcon },
];

export const PRODUCT_BULLETS: string[] = [
	"Finance, budgets, and spending in one timeline",
	"Skincare and personal care routines you can follow daily",
	"Meals, habits, and daily schedules on web and mobile",
	"Fashion and wardrobe planning tied to your week",
	"AI assist for planning without leaving your OS",
];

export type IncidentEvent = {
	title: string;
	detail: string;
	tone: "info" | "ok";
	icon: "activity" | "search" | "pr" | "wrench" | "shield";
};

export const INCIDENT_TIMELINE: IncidentEvent[] = [
	{
		title: "Workspace install",
		detail: "bun install resolves apps/* and packages/*",
		tone: "info",
		icon: "activity",
	},
	{
		title: "Turbo pipeline",
		detail: "dev Â· build Â· lint Â· typecheck orchestrated",
		tone: "info",
		icon: "search",
	},
	{
		title: "Architecture check",
		detail: "import boundaries enforced before commit",
		tone: "info",
		icon: "pr",
	},
	{
		title: "Test & e2e",
		detail: "Vitest + Playwright green on web",
		tone: "info",
		icon: "wrench",
	},
	{
		title: "Ready to ship",
		detail: "Docker Compose optional â€” school-os is live",
		tone: "ok",
		icon: "shield",
	},
];

export type ToolCall = {
	name: string;
	status: "done" | "running";
};

export const AGENT_TOOL_CALLS: ToolCall[] = [
	{ name: "turbo run build", status: "done" },
	{ name: "biome check", status: "done" },
	{ name: "architecture:check", status: "done" },
];

export type CapabilityCard = {
	title: string;
	description: string;
	span: 2 | 4;
	kind: "reasoning" | "tools" | "memory" | "output" | "approval";
	palette: MeshPalette;
};

export type MeshPalette = "blue" | "teal" | "lime" | "amber";

export const CAPABILITY_CARDS: CapabilityCard[] = [
	{
		title: "See the monorepo reason",
		description:
			"Turbo graphs tasks across apps â€” watch install, lint, and build fan out from one command.",
		span: 4,
		kind: "reasoning",
		palette: "blue",
	},
	{
		title: "Add an app in one workspace",
		description:
			"Drop a package under apps/ or packages/, export as @school-os/*, and wire it into turbo.json.",
		span: 2,
		kind: "tools",
		palette: "blue",
	},
	{
		title: "Shared UI that sticks",
		description: "Design tokens and primitives live in @school-os/ui for web.",
		span: 2,
		kind: "memory",
		palette: "teal",
	},
	{
		title: "Typed contracts end to end",
		description: "Zod on Nest, TypeScript everywhere â€” schemas and configs stay honest.",
		span: 2,
		kind: "output",
		palette: "lime",
	},
	{
		title: "Gates before it merges",
		description: "Lefthook formats, lints, typechecks, scans secrets, and checks architecture.",
		span: 2,
		kind: "approval",
		palette: "blue",
	},
];

export type Stat = {
	value: number;
	suffix: string;
	prefix: string;
	label: string;
	display?: string;
	detail?: string;
};

export const STATS: Stat[] = [
	{
		value: 5,
		suffix: "",
		prefix: "",
		label: "Runnable apps",
		detail: "web Â· mobile Â· nest Â· docs Â· rust",
	},
	{
		value: 3,
		suffix: "",
		prefix: "",
		label: "Shared packages",
		detail: "ui Â· logger Â· tsconfig",
	},
	{
		value: 0,
		suffix: "",
		prefix: "",
		label: "Time to first dev",
		display: "<10m",
		detail: "clone â†’ install â†’ run",
	},
	{
		value: 4,
		suffix: "+",
		prefix: "",
		label: "Languages wired",
		detail: "TS Â· Rust Â· Bash Â· Python",
	},
];

export type AboutPrinciple = {
	title: string;
	description: string;
	icon: "bridge" | "eye" | "shield";
};

export const ABOUT_PRINCIPLES: AboutPrinciple[] = [
	{
		icon: "bridge",
		title: "Starter, not a demo dump",
		description:
			"Every app and package earns its place by helping you ship a real product â€” not a throwaway scaffold.",
	},
	{
		icon: "eye",
		title: "Boundaries you can see",
		description:
			"Architecture checks and docs make import rules explicit so AI agents and humans stay inside the lanes.",
	},
	{
		icon: "shield",
		title: "Quality by default",
		description:
			"Biome, Lefthook, Turbo, and CI run before code lands â€” so green hooks become the habit, not a hope.",
	},
];

export type AboutTeamMember = {
	id: string;
	name: string;
	role: string;
	seed: string;
	bio: string;
	tone: "green" | "teal" | "blue" | "amber";
	profileHref: string;
};

export const ABOUT_TEAM: AboutTeamMember[] = [
	{
		id: "priya",
		name: "Priya Nair",
		role: "Lead maintainer",
		seed: "PriyaNair",
		bio: "Owns the monorepo spine and docs. Wants clone-to-dev to feel boringly reliable.",
		tone: "green",
		profileHref: "#",
	},
	{
		id: "marcus",
		name: "Marcus Vale",
		role: "Platform engineer",
		seed: "MarcusVale",
		bio: "Keeps Nest, Docker, and Turbo pipelines honest. Obsessed with cache-friendly task graphs.",
		tone: "teal",
		profileHref: "#",
	},
	{
		id: "lena",
		name: "Lena Ortiz",
		role: "DX & tooling",
		seed: "LenaOrtiz",
		bio: "Ships hooks, Biome rules, and agent guidance so every commit stays reviewable.",
		tone: "blue",
		profileHref: "#",
	},
	{
		id: "theo",
		name: "Theo Park",
		role: "Mobile & UI",
		seed: "TheoPark",
		bio: "Expo Router + shared design tokens. Believes the starter should look production-ready on day one.",
		tone: "amber",
		profileHref: "#",
	},
];

export type Testimonial = {
	quote: string;
	name: string;
	role: string;
	seed: string;
};

export const TESTIMONIALS_ROW_ONE: Testimonial[] = [
	{
		quote:
			"We skipped three weeks of wiring Turbo, hooks, and Docker. Starter was already opinionated the right way.",
		name: "Maya Chen",
		role: "Staff Eng, campus product",
		seed: "Maya",
	},
	{
		quote:
			"One clone gave us Next, Expo, and Nest with shared UI. Architecture checks caught bad imports on day one.",
		name: "Diego Santos",
		role: "Frontend lead",
		seed: "Diego",
	},
	{
		quote:
			"Students can PR into a real monorepo without babysitting tooling. lint and typecheck just work.",
		name: "Priya Nair",
		role: "CS faculty",
		seed: "Priya",
	},
];

export const TESTIMONIALS_ROW_TWO: Testimonial[] = [
	{
		quote:
			"Adding a package under packages/ and exporting @school-os/* took minutes. Turbo picked it up immediately.",
		name: "Theo Park",
		role: "Mobile engineer",
		seed: "Theo",
	},
	{
		quote:
			"Lefthook + secret scan + architecture check means I trust contributor PRs before they hit CI.",
		name: "Lena Ortiz",
		role: "Platform engineer",
		seed: "Lena",
	},
	{
		quote:
			"Docs live in the same repo. New teammates read /docs/quick-start and are productive the same afternoon.",
		name: "Maya Chen",
		role: "Staff Eng, campus product",
		seed: "MayaTwo",
	},
];

export type TerminalLine = {
	text: string;
	tone: "prompt" | "muted" | "ok" | "info";
};

export const DEPLOY_TERMINAL: TerminalLine[] = [
	{ text: "bun install", tone: "prompt" },
	{ text: "Resolved workspaces apps/* packages/*", tone: "ok" },
	{ text: "bun run prepare  # lefthook hooks", tone: "prompt" },
	{ text: "bun run dev      # turbo starts the stack", tone: "ok" },
];

export type PricingTier = {
	services: number | "unlimited";
	monthly: number;
};

/** Slider steps: free â†’ team â†’ org (workspaces / projects included). */
export const PRICING_TIERS: PricingTier[] = [
	{ services: 1, monthly: 0 },
	{ services: 5, monthly: 49 },
	{ services: 15, monthly: 149 },
	{ services: 50, monthly: 399 },
	{ services: "unlimited", monthly: 799 },
];

export const PRICING_FEATURES: string[] = [
	"Full monorepo starter (web Â· mobile Â· Nest Â· docs Â· Rust)",
	"Shared @school-os packages and TS configs",
	"Lefthook, Biome, Turbo, and architecture checks",
	"Docker Compose fragments + Dev Container",
	"Docs site and production roadmap baked in",
];

export type WhyCard = {
	id: string;
	title: string;
	description: string;
	palette: MeshPalette;
	kind: "route" | "keys" | "ready";
};

export const WHY_CARDS: WhyCard[] = [
	{
		id: "route",
		title: "One graph for every app",
		description:
			"Turbo orchestrates install, lint, build, and test across the workspace â€” no glue scripts to invent.",
		palette: "blue",
		kind: "route",
	},
	{
		id: "keys",
		title: "Boundaries you can enforce",
		description:
			"Architecture checks and AGENTS.md keep apps and packages in their lanes â€” humans and AI included.",
		palette: "lime",
		kind: "keys",
	},
	{
		id: "ready",
		title: "Running in under ten minutes",
		description:
			"Clone, bun install, bun run prepare, bun run dev â€” web, API, and docs come up without a weekend of setup.",
		palette: "amber",
		kind: "ready",
	},
];

export type FaqItem = {
	id: string;
	question: string;
	answer: string;
	icon: IconSvgElement;
};

export const FAQ_ITEMS: FaqItem[] = [
	{
		id: "agents",
		question: "Do I need Docker to start?",
		answer:
			"No. Host-only is fine: install Bun, bun install, bun run prepare, bun run dev. Compose is optional when you want Postgres or the full containerized stack.",
		icon: HexagonIcon,
	},
	{
		id: "approvals",
		question: "Can we keep or drop apps we do not need?",
		answer:
			"Yes. Apps under apps/ are independent. Remove or ignore what you do not ship yet â€” keep packages you still share.",
		icon: SecurityCheckIcon,
	},
	{
		id: "stack",
		question: "What stacks does Starter include?",
		answer:
			"Next.js web, Expo mobile, NestJS API, Fumadocs docs, and a Rust binary â€” plus shared UI, logger, and TypeScript configs.",
		icon: Package01Icon,
	},
	{
		id: "traces",
		question: "How do architecture boundaries work?",
		answer:
			"scripts/architecture/check-boundaries.sh runs in hooks and CI so apps cannot import each otherâ€™s internals. Overrides are documented in /docs/overrides.",
		icon: CommandIcon,
	},
	{
		id: "pricing",
		question: "Is the starter free to use?",
		answer:
			"The monorepo starter is free to clone and run. Paid tiers are optional for team seats, support, and managed onboarding â€” annual billing includes two months free.",
		icon: GemIcon,
	},
	{
		id: "security",
		question: "What quality gates run before a commit?",
		answer:
			"Lefthook formats with Biome, lints, typechecks, blocks large files, scans for obvious secrets, and runs the architecture check â€” Conventional Commits required.",
		icon: OctagonIcon,
	},
];

export type FooterColumn = {
	title: string;
	links: NavLink[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
	{
		title: "Product",
		links: [
			{ label: "Apps overview", href: "/#product" },
			{ label: "Capabilities", href: "/#capabilities" },
			{ label: "Pricing", href: "/pricing" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Docs", href: "http://localhost:3002/docs" },
			{ label: "Stack", href: "/#customers" },
			{ label: "FAQ", href: "/#faq" },
			{ label: "Quick start", href: "/#deploy" },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About", href: "/about" },
			{ label: "Careers", href: "/about" },
			{ label: "Contact", href: "/about" },
		],
	},
];

export function dicebearUrl(seed: string): string {
	return `https://api.dicebear.com/10.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}


