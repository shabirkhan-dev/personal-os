import { Spinner } from "@personal-os/ui/components/spinner";
import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/modules/auth/components";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-dashboard-bg p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-md">
				<Suspense
					fallback={
						<div className="flex min-h-48 items-center justify-center">
							<Spinner className="size-6" />
						</div>
					}
				>
					<VerifyEmailForm />
				</Suspense>
			</div>
		</div>
	);
}
