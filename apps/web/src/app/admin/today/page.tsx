"use client";

import { Sun03Icon } from "@hugeicons/core-free-icons";
import {
	ModulePageHeader,
	TodayView,
	useTodayQuery,
	useToggleItemMutation,
} from "@/modules/routines";

export default function AdminTodayPage() {
	const { data: view, isLoading, isError, refetch } = useTodayQuery();
	const toggleMutation = useToggleItemMutation();

	return (
		<div>
			<ModulePageHeader
				eyebrow="Personal OS"
				title="Today"
				description="Work through your routines, one check-off at a time."
				icon={Sun03Icon}
			/>
			<div className="mx-auto w-full max-w-[820px] px-3 py-5 sm:px-6 lg:px-8">
				<TodayView
					view={view}
					loading={isLoading}
					hasError={isError}
					onRetry={() => refetch()}
					togglingItemId={
						toggleMutation.isPending ? (toggleMutation.variables?.itemId ?? null) : null
					}
					onToggle={(routineId, itemId) => toggleMutation.mutate({ routineId, itemId })}
				/>
			</div>
		</div>
	);
}
