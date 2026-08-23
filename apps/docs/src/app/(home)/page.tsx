import {
	ArrowRight,
	BookOpen,
	Boxes,
	GitBranch,
	Rocket,
	ShieldCheck,
	Sparkles,
	Terminal,
} from "lucide-react";
import Link from "next/link";

const paths = [
	{
		icon: BookOpen,
		title: "I am new to the repo",
		description: "Install the workspace, start the right services, and learn the layout.",
		href: "/docs/quick-start",
		label: "Start with setup",
	},
	{
		icon: Boxes,
		title: "I am shipping a feature",
		description: "Follow the team workflow, boundaries, and API contract rules.",
		href: "/docs/development-workflow",
		label: "Read the workflow",
	},
	{
		icon: ShieldCheck,
		title: "I am consuming the API",
		description: "Check module readiness, envelopes, dates, auth, and exact endpoints.",
		href: "/docs/backend-api",
		label: "Open the API board",
	},
	{
		icon: Rocket,
		title: "I am operating the stack",
		description: "Run Postgres locally, deploy the services, and verify health safely.",
		href: "/docs/docker",
		label: "Run the platform",
	},
];

const stack = [
	"Bun + Turborepo",
	"Next.js web",
	"Expo mobile",
	"NestJS API",
	"FastAPI assist",
	"Fumadocs",
];

export default function HomePage() {
	return (
		<main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-16 lg:px-10">
			<section className="relative overflow-hidden rounded-2xl border border-fd-border bg-fd-card px-6 py-10 shadow-sm sm:px-10 sm:py-14">
				<div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fd-primary/80 via-fd-primary/20 to-transparent" />
				<div className="max-w-3xl">
					<p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-fd-muted-foreground uppercase">
						<Sparkles className="size-4 text-fd-primary" aria-hidden="true" />
						Personal OS · engineering handbook
					</p>
					<h1 className="text-4xl font-semibold tracking-tight text-fd-foreground sm:text-6xl">
						Build a calmer life OS, one reliable slice at a time.
					</h1>
					<p className="mt-6 max-w-2xl text-base leading-7 text-fd-muted-foreground sm:text-lg">
						The single source of truth for onboarding, architecture, API contracts, local
						development, deployment, and team coordination across Personal OS.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link
							href="/docs/quick-start"
							className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
						>
							Start building <ArrowRight className="size-4" aria-hidden="true" />
						</Link>
						<Link
							href="/docs/backend-api"
							className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-4 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
						>
							Use the API <ShieldCheck className="size-4" aria-hidden="true" />
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-12" aria-labelledby="paths-heading">
				<div className="mb-5 flex items-end justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-fd-primary">Find your path</p>
						<h2 id="paths-heading" className="mt-1 text-2xl font-semibold tracking-tight">
							What are you doing today?
						</h2>
					</div>
					<Link
						href="/docs"
						className="hidden items-center gap-1 text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground sm:inline-flex"
					>
						Browse all docs <ArrowRight className="size-4" aria-hidden="true" />
					</Link>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{paths.map((path) => {
						const Icon = path.icon;
						return (
							<Link
								key={path.title}
								href={path.href}
								className="group rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50 hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-primary"
							>
								<div className="flex items-start justify-between gap-4">
									<span className="flex size-9 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
										<Icon className="size-4" aria-hidden="true" />
									</span>
									<ArrowRight
										className="size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</div>
								<h3 className="mt-5 font-semibold">{path.title}</h3>
								<p className="mt-2 min-h-12 text-sm leading-6 text-fd-muted-foreground">
									{path.description}
								</p>
								<p className="mt-4 text-sm font-medium text-fd-primary">{path.label}</p>
							</Link>
						);
					})}
				</div>
			</section>

			<section className="mt-12 grid gap-8 border-t border-fd-border pt-8 lg:grid-cols-[1.2fr_0.8fr]">
				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-fd-primary">
						<Terminal className="size-4" aria-hidden="true" />
						The platform today
					</div>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight">
						A focused foundation for personal systems.
					</h2>
					<p className="mt-3 max-w-2xl leading-7 text-fd-muted-foreground">
						Authentication, profiles, routines, and finance are the current product surface. Care,
						food, fashion, and deeper AI workflows are planned slices—not undocumented assumptions.
					</p>
					<div className="mt-5 flex flex-wrap gap-2">
						{["Auth + profiles", "Routines", "Finance", "AI beta"].map((item) => (
							<span
								key={item}
								className="rounded-full border border-fd-border px-3 py-1.5 text-sm text-fd-muted-foreground"
							>
								{item}
							</span>
						))}
					</div>
				</div>
				<div className="rounded-xl border border-fd-border bg-fd-card p-5">
					<div className="flex items-center gap-2 text-sm font-medium">
						<GitBranch className="size-4 text-fd-primary" aria-hidden="true" />
						Keep the source of truth close
					</div>
					<p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
						Product direction lives in the production roadmap. Agent rules live in{" "}
						<code>AGENTS.md</code>. Cross-team work lives in <code>.agents/</code>. API callers use
						the status board below.
					</p>
					<Link
						href="/docs/team-coordination"
						className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-fd-primary"
					>
						Read the coordination guide <ArrowRight className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</section>

			<section className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-fd-border pt-6 text-sm text-fd-muted-foreground">
				<span className="font-medium text-fd-foreground">Stack</span>
				{stack.map((item) => (
					<span key={item} className="inline-flex items-center gap-2">
						<span className="size-1.5 rounded-full bg-fd-primary/60" aria-hidden="true" />
						{item}
					</span>
				))}
			</section>
		</main>
	);
}
