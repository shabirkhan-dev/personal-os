import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@personal-os/ui/components/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BillingCancelPage() {
	return (
		<div className="min-h-[calc(100vh-4rem)] bg-dashboard-bg">
			<main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:py-24">
				<section className="rounded-[16px] border border-dashboard-border bg-dashboard-surface p-6 text-center sm:p-8">
					<p className="text-[11px] text-dashboard-text-muted uppercase tracking-wide">Billing</p>
					<h1 className="mt-1.5 font-semibold text-[22px] text-dashboard-text-primary tracking-tight">
						Checkout canceled
					</h1>
					<p className="mt-2 text-[13px] text-dashboard-text-muted leading-5">
						Nothing was charged. You can restart checkout anytime from your billing page.
					</p>
					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
						<Link href="/billing" className={cn(buttonVariants(), "w-full gap-1.5 sm:w-auto")}>
							<HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={1.8} />
							Back to billing
						</Link>
						<Link
							href="/pricing"
							className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
						>
							Pricing
						</Link>
					</div>
				</section>
			</main>
		</div>
	);
}
