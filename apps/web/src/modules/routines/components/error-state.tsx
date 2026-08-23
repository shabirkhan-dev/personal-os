import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@personal-os/ui/components/button";
import { Card, CardContent } from "@personal-os/ui/components/card";

export function ErrorState({
	description,
	onRetry,
}: {
	description: string;
	onRetry?: () => void;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
				<div className="flex size-11 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-surface-strong text-dashboard-text-muted">
					<HugeiconsIcon icon={Alert02Icon} className="size-5" strokeWidth={1.8} />
				</div>
				<p className="text-[13px] text-dashboard-text-secondary">{description}</p>
				{onRetry && (
					<Button variant="outline" size="sm" onClick={onRetry}>
						Try again
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
