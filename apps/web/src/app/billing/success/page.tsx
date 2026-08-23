import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@personal-os/ui/components/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BillingSuccessPage() {
	return (
		<div className="min-h-[calc(100vh-4rem)] bg-dashboard-bg">
			<main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:py-24">
				<section className="rounded-[16px] border border-dashboard-border bg-dashboard-surface p-6 text-center sm:p-8">
					<span className="mx-auto grid size-11 place-items-center rounded-full border border-dashboard-border bg-dashboard-surface-elevated">
						<HugeiconsIcon
							icon={CheckmarkCircle02Icon}
							className="size-5 text-dashboard-text-primary"
							strokeWidth={1.8}
						/>
					</span>
					<p className="mt-5 text-[11px] text-dashboard-text-muted uppercase tracking-wide">
						Billing
					</p>
					<h1 className="mt-1.5 font-semibold text-[22px] text-dashboard-text-primary tracking-tight">
						Payment received
					</h1>
					<p className="mt-2 text-[13px] text-dashboard-text-muted leading-5">
						Your subscription activates once the provider webhook confirms it — usually within a few
						seconds.
					</p>
					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
						<Link href="/billing" className={cn(buttonVariants(), "w-full sm:w-auto")}>
							View billing
						</Link>
						<Link
							href="/"
							className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
						>
							Home
						</Link>
					</div>
				</section>
			</main>
		</div>
	);
}
